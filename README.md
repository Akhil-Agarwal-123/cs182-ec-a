# Ed Analyzer

A tool to visualize and analyze EdStem forum posts with AI-powered analysis.

## Quick Start

The data is already processed and included in the repository. Just run the frontend:

```bash
cd ed-analyzer
npm install
npm run dev
```

The app will open at `http://localhost:5173` (or the port shown in terminal).

## Running Post Analysis

To analyze all posts using Gemini AI (adds detailed analysis to each post):

1. **Install Python dependencies:**
   ```bash
   pip install google-generativeai python-dotenv
   ```

2. **Set up your Gemini API key:**
   Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the analysis script:**
   ```bash
   python analyze_posts.py
   ```

   This will:
   - Read all posts from `ed-analyzer/src/data/posts.json`
   - Analyze each post using Gemini 2.5 Flash Lite
   - Add a `gemini_analysis` field to each post
   - Save the updated data back to the JSON file
   - Skip posts that already have analysis (resumable)

4. **Generate model summaries** (optional):
   ```bash
   python generate_model_summary.py
   ```
   This creates `ed-analyzer/src/data/model_analysis.json` with aggregated summaries for each LLM by homework.

5. **Refresh the website** to see the new analyses in:
   - **Model Analysis tab**: "Our Analysis" section (collapsible) for each post, and "Performance Summary" dropdown
   - **Overview tab**: Matrix and charts

## Features

The frontend provides three views:
1. **Overview**: Matrix, charts, and AI-generated strengths/weaknesses summaries for each LLM
2. **Post Feed**: Browse and filter all posts with search functionality
3. **Model Analysis**: Side-by-side comparison of posts with detailed Gemini AI analysis

## Other Commands

- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

- **React frontend** (`ed-analyzer/`): Visualize and analyze the filtered posts
- **Python scripts** (root directory): 
  - `analyze_posts.py`: AI analysis of posts using Gemini
  - `generate_model_summary.py`: Generate aggregated summaries for model_analysis.json
  - `get_ed_posts.py` & `filter_ed_posts.py`: Optional scripts for fetching and filtering EdStem posts (data already included)

