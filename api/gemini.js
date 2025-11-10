import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, model, prompt } = req.body;

  // Validate required fields
  if (!apiKey || !model || !prompt) {
    return res.status(400).json({ error: 'Missing required fields: apiKey, model, or prompt' });
  }

  try {
    // Initialize Gemini with the provided API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model });

    // Generate content
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;

    // Return the response
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Handle specific error cases
    if (error.message.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (error.message.includes('Quota exceeded')) {
      return res.status(429).json({ error: 'API quota exceeded' });
    }
    
    return res.status(500).json({ error: 'Error calling Gemini API: ' + error.message });
  }
}