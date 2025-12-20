import json
import os
from collections import defaultdict

def generate_summary_for_posts(posts, llm_name, homework_filter=None):
    """
    Generate a concise single-sentence summary for a set of posts based on their gemini_analysis.
    If homework_filter is None, generates summary for "All".
    """
    filtered_posts = [p for p in posts if p.get('llm') == llm_name]
    
    if homework_filter is not None:
        filtered_posts = [p for p in filtered_posts if p.get('homework_number') == homework_filter]
    
    if not filtered_posts:
        return None
    
    # Collect all analysis data
    all_summaries = []
    all_strengths = []
    all_weaknesses = []
    performance_scores = {
        'accuracy': [],
        'one_shot': [],
        'reasoning': []
    }
    
    for post in filtered_posts:
        analysis = post.get('gemini_analysis')
        if not analysis:
            continue
        
        if analysis.get('summary'):
            all_summaries.append(analysis['summary'])
        
        if analysis.get('strengths'):
            all_strengths.extend(analysis['strengths'])
        
        if analysis.get('weaknesses'):
            all_weaknesses.extend(analysis['weaknesses'])
        
        perf = analysis.get('performance', {})
        if perf.get('accuracy'):
            performance_scores['accuracy'].append(perf['accuracy'])
        if perf.get('one_shot_capability'):
            performance_scores['one_shot'].append(perf['one_shot_capability'])
        if perf.get('reasoning_quality'):
            performance_scores['reasoning'].append(perf['reasoning_quality'])
    
    if not all_summaries and not all_strengths and not all_weaknesses:
        return None
    
    # If we have summaries, use them to build a combined summary
    if all_summaries:
        # For single post, use its summary directly
        if len(all_summaries) == 1:
            summary = all_summaries[0]
            # Make it concise if too long
            if len(summary) > 300:
                summary = summary.split('.')[0] + "."
            return summary
        
        # For multiple posts, extract key themes
        # Look for common patterns in summaries
        performance_keywords = {
            'strong': 0, 'excellent': 0, 'good': 0, 'high': 0,
            'struggled': 0, 'weak': 0, 'poor': 0, 'inconsistent': 0,
            'accurate': 0, 'correct': 0, 'flawless': 0
        }
        
        for summary in all_summaries:
            summary_lower = summary.lower()
            for keyword, _ in performance_keywords.items():
                if keyword in summary_lower:
                    performance_keywords[keyword] += 1
        
        # Build summary based on patterns
        positive_count = sum(performance_keywords[k] for k in ['strong', 'excellent', 'good', 'high', 'accurate', 'correct', 'flawless'])
        negative_count = sum(performance_keywords[k] for k in ['struggled', 'weak', 'poor', 'inconsistent'])
        
        summary_text = f"{llm_name}"
        
        if homework_filter is not None:
            summary_text += f" on HW{homework_filter}"
        
        if positive_count > negative_count:
            summary_text += " demonstrated strong understanding"
        elif negative_count > positive_count:
            summary_text += " struggled with"
        else:
            summary_text += " showed mixed performance"
        
        # Add most common strength or weakness
        if all_strengths and positive_count > 0:
            strength_counts = defaultdict(int)
            for s in all_strengths:
                # Get first meaningful part
                key = s.split('.')[0].split(',')[0].strip()
                if len(key) > 5:  # Only meaningful phrases
                    strength_counts[key] += 1
            if strength_counts:
                top_strength = max(strength_counts.items(), key=lambda x: x[1])
                summary_text += f" of {top_strength[0].lower()}"
        
        if all_weaknesses and negative_count > 0:
            weakness_counts = defaultdict(int)
            for w in all_weaknesses:
                key = w.split('.')[0].split(',')[0].strip()
                if len(key) > 5:
                    weakness_counts[key] += 1
            if weakness_counts:
                top_weakness = max(weakness_counts.items(), key=lambda x: x[1])
                if positive_count <= negative_count:
                    summary_text += f" {top_weakness[0].lower()}"
                else:
                    summary_text += f" but struggled with {top_weakness[0].lower()}"
        
        summary_text += "."
        return summary_text
    
    # Fallback: build from strengths/weaknesses
    if all_strengths or all_weaknesses:
        summary_text = f"{llm_name}"
        if homework_filter is not None:
            summary_text += f" on HW{homework_filter}"
        
        if all_strengths:
            strength_counts = defaultdict(int)
            for s in all_strengths:
                key = s.split('.')[0].strip()
                strength_counts[key] += 1
            if strength_counts:
                top = max(strength_counts.items(), key=lambda x: x[1])
                summary_text += f" excelled at {top[0].lower()}"
        
        if all_weaknesses:
            weakness_counts = defaultdict(int)
            for w in all_weaknesses:
                key = w.split('.')[0].strip()
                weakness_counts[key] += 1
            if weakness_counts:
                top = max(weakness_counts.items(), key=lambda x: x[1])
                if all_strengths:
                    summary_text += f" but struggled with {top[0].lower()}"
                else:
                    summary_text += f" struggled with {top[0].lower()}"
        
        summary_text += "."
        return summary_text
    
    return None


def main():
    # Load posts
    input_file = 'ed-analyzer/src/data/posts.json'
    output_file = 'ed-analyzer/src/data/model_analysis.json'
    
    print(f"Loading posts from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    print(f"Found {len(posts)} posts.")
    
    # Get all unique LLMs and homeworks
    llms = sorted(set(p.get('llm') for p in posts if p.get('llm')))
    homeworks = sorted(set(p.get('homework_number') for p in posts if p.get('homework_number') is not None and p.get('homework_number') != -1))
    
    print(f"Found LLMs: {llms}")
    print(f"Found Homeworks: {homeworks}")
    
    # Build the summary structure
    summary_data = {}
    
    for llm in llms:
        summary_data[llm] = {}
        
        # Generate "All" summary
        all_summary = generate_summary_for_posts(posts, llm, homework_filter=None)
        if all_summary:
            summary_data[llm]["All"] = all_summary
        else:
            summary_data[llm]["All"] = f"No analysis available for {llm} across all assignments."
        
        # Generate summaries for each homework
        for hw in homeworks:
            hw_summary = generate_summary_for_posts(posts, llm, homework_filter=hw)
            if hw_summary:
                summary_data[llm][str(hw)] = hw_summary
    
    # Save to file
    print(f"\nSaving summary to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Summary generated successfully!")
    print(f"\nSummary structure:")
    for llm, summaries in summary_data.items():
        print(f"  {llm}: {len(summaries)} entries (All + {len(summaries)-1} homeworks)")


if __name__ == '__main__':
    main()

