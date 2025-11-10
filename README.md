# Document Analyzer with Gemini AI

This is a document analyzer application that uses Google's Gemini AI to analyze PDF documents.

## Setup Instructions

1. **Environment Variables**:
   Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. **Push to GitHub**:
   Create a GitHub repository and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com) and sign up or log in
   - Click "New Project"
   - Import your GitHub repository
   - In the configuration, add your environment variable:
     - Key: `GEMINI_API_KEY`
     - Value: Your actual Gemini API key
   - Click "Deploy"

## How It Works

1. Upload a PDF document
2. Enter your Gemini API key
3. Select the type of analysis you want
4. Click "Analyze Document"
5. View the analysis results and download as PDF if desired

## Features

- PDF text extraction
- Multiple analysis types (General Analysis, Executive Summary, Key Points, Q&A)
- PDF report generation
- Responsive design