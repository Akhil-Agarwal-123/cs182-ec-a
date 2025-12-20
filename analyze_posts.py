import json
import os
import time
import re
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.")

genai.configure(api_key=GEMINI_API_KEY)

# Rate limiting: 10 requests per minute = 1 request every 6 seconds minimum
# Using 7 seconds to be safe with buffer
MIN_DELAY_BETWEEN_REQUESTS = 7  # seconds
MAX_REQUESTS_PER_MINUTE = 10

def extract_retry_delay(error_message):
    """Extract retry delay from error message if available."""
    # Look for "Please retry in X.XXs" pattern
    match = re.search(r'Please retry in ([\d.]+)s', error_message)
    if match:
        return float(match.group(1))
    
    # Look for retry_delay seconds
    match = re.search(r'seconds:\s*(\d+)', error_message)
    if match:
        return float(match.group(1))
    
    return None


def analyze_post(post, max_retries=3):
    """
    Analyze a single post using Gemini API with retry logic.
    Returns a structured analysis in JSON format.
    """
    title = post.get('title', '')
    content = post.get('document', '') or post.get('content', '')
    llm = post.get('llm', 'Unknown')
    homework_number = post.get('homework_number', -1)
    
    # Create a comprehensive prompt for analysis
    prompt = f"""You are analyzing a student's report about using an LLM (Large Language Model) to solve homework problems. 

Post Title: {title}
LLM Used: {llm}
Homework Number: {homework_number if homework_number != -1 else 'Unknown'}

Post Content:
{content}

Please provide a detailed, structured analysis of this post. Focus on:
1. The LLM's performance (accuracy, one-shot capability, reasoning quality)
2. Strengths demonstrated by the LLM
3. Weaknesses or limitations observed
4. Notable behaviors or patterns
5. Quality of explanations and derivations
6. Any concerns or issues raised by the student

Format your response as a JSON object with the following structure:
{{
    "summary": "A brief 2-3 sentence summary of the overall assessment",
    "performance": {{
        "accuracy": "Assessment of correctness (e.g., 'High', 'Moderate', 'Low')",
        "one_shot_capability": "Whether the LLM solved problems on first attempt",
        "reasoning_quality": "Quality of the reasoning process (e.g., 'Excellent', 'Good', 'Needs Improvement')"
    }},
    "strengths": [
        "List of specific strengths observed (3-5 items)"
    ],
    "weaknesses": [
        "List of specific weaknesses or limitations (3-5 items)"
    ],
    "notable_behaviors": [
        "Notable patterns, behaviors, or interesting observations (2-4 items)"
    ],
    "detailed_analysis": "A more detailed paragraph analysis covering key aspects of the LLM's performance"
}}

Be thorough, specific, and objective. Reference specific examples from the post when possible."""

    # Try gemini-2.5-flash-lite first, fallback to available models
    model = None
    model_names = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-exp', 'gemini-1.5-flash']
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            break
        except Exception:
            continue
    
    if model is None:
        raise Exception("Could not initialize any Gemini model")
    
    # Retry logic for rate limits
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            
            # Extract text from response
            analysis_text = response.text.strip()
            
            # Try to parse as JSON (sometimes Gemini wraps it in markdown)
            if analysis_text.startswith('```json'):
                analysis_text = analysis_text.replace('```json', '').replace('```', '').strip()
            elif analysis_text.startswith('```'):
                analysis_text = analysis_text.replace('```', '').strip()
            
            # Parse JSON
            try:
                analysis_json = json.loads(analysis_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, wrap the text in a structured format
                analysis_json = {
                    "summary": analysis_text[:200] + "..." if len(analysis_text) > 200 else analysis_text,
                    "performance": {
                        "accuracy": "Not specified",
                        "one_shot_capability": "Not specified",
                        "reasoning_quality": "Not specified"
                    },
                    "strengths": [],
                    "weaknesses": [],
                    "notable_behaviors": [],
                    "detailed_analysis": analysis_text
                }
            
            return analysis_json
            
        except Exception as e:
            error_str = str(e)
            
            # Check if it's a rate limit error (429)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate limit' in error_str.lower():
                retry_delay = extract_retry_delay(error_str)
                
                if retry_delay:
                    wait_time = retry_delay + 2  # Add 2 seconds buffer
                    print(f"  ⚠ Rate limit hit. Waiting {wait_time:.1f} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    # Default wait time if we can't parse it
                    wait_time = 60  # Wait a full minute
                    print(f"  ⚠ Rate limit hit. Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                
                if attempt < max_retries - 1:
                    print(f"  ↻ Retrying (attempt {attempt + 2}/{max_retries})...")
                    continue
                else:
                    print(f"  ✗ Max retries reached for post {post.get('id')}")
                    raise
            
            # For other errors, don't retry
            print(f"Error analyzing post {post.get('id')}: {error_str}")
            return {
                "summary": f"Error during analysis: {error_str}",
                "performance": {
                    "accuracy": "Error",
                    "one_shot_capability": "Error",
                    "reasoning_quality": "Error"
                },
                "strengths": [],
                "weaknesses": [],
                "notable_behaviors": [],
                "detailed_analysis": f"Failed to analyze: {error_str}"
            }
    
    # Should not reach here, but just in case
    raise Exception("Failed to analyze post after all retries")


def main():
    # Load posts
    input_file = 'ed-analyzer/src/data/posts.json'
    output_file = 'ed-analyzer/src/data/posts.json'
    
    print(f"Loading posts from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    print(f"Found {len(posts)} posts to analyze.")
    
    # Check which posts already have analysis
    posts_to_analyze = []
    posts_already_analyzed = 0
    
    for post in posts:
        if 'gemini_analysis' not in post or not post.get('gemini_analysis'):
            posts_to_analyze.append(post)
        else:
            posts_already_analyzed += 1
    
    print(f"Posts already analyzed: {posts_already_analyzed}")
    print(f"Posts to analyze: {len(posts_to_analyze)}")
    
    if not posts_to_analyze:
        print("All posts already have analysis. Exiting.")
        return
    
    # Track request timestamps for rate limiting
    request_times = []
    
    # Analyze each post
    for idx, post in enumerate(posts_to_analyze):
        post_id = post.get('id', 'unknown')
        llm = post.get('llm', 'Unknown')
        hw = post.get('homework_number', -1)
        
        print(f"\n[{idx + 1}/{len(posts_to_analyze)}] Analyzing post {post_id} (LLM: {llm}, HW: {hw})...")
        
        # Rate limiting: ensure we don't exceed 10 requests per minute
        current_time = datetime.now()
        
        # Remove timestamps older than 1 minute
        request_times = [t for t in request_times if current_time - t < timedelta(minutes=1)]
        
        # If we've made 10 requests in the last minute, wait
        if len(request_times) >= MAX_REQUESTS_PER_MINUTE:
            oldest_request = min(request_times)
            wait_until = oldest_request + timedelta(minutes=1)
            wait_seconds = (wait_until - current_time).total_seconds() + 1  # Add 1 second buffer
            if wait_seconds > 0:
                print(f"  ⏳ Rate limit: {len(request_times)} requests in last minute. Waiting {wait_seconds:.1f} seconds...")
                time.sleep(wait_seconds)
                # Update current_time after waiting
                current_time = datetime.now()
                request_times = [t for t in request_times if current_time - t < timedelta(minutes=1)]
        
        # Record this request
        request_times.append(current_time)
        
        try:
            analysis = analyze_post(post)
            post['gemini_analysis'] = analysis
            
            # Save progress after each post
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(posts, f, indent=3, ensure_ascii=False)
            
            print(f"✓ Analysis complete for post {post_id}")
            
        except Exception as e:
            print(f"✗ Failed to analyze post {post_id}: {str(e)}")
            # Still save progress even if this one failed
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(posts, f, indent=3, ensure_ascii=False)
        
        # Wait between requests (unless we're already rate limited above)
        if idx < len(posts_to_analyze) - 1:  # Don't wait after the last post
            time.sleep(MIN_DELAY_BETWEEN_REQUESTS)
    
    print(f"\n✓ All analyses complete! Results saved to {output_file}")


if __name__ == '__main__':
    main()

