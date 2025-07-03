// server/chat.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load .env file
dotenv.config();

const app = express();
const port = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Initialize Gemini client with API Key
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Helper to mask API key in logs
const maskApiKey = (key) => {
  if (!key) return 'NOT_SET';
  if (key.length < 8) return 'INVALID_LENGTH';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

// ✅ POST route for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { query } = req.body;

    console.log('📨 Incoming chat request:', {
      query,
      timestamp: new Date().toISOString(),
    });

    console.log('🔑 Gemini API Key status:', maskApiKey(process.env.GEMINI_API_KEY));

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: '❌ Query is required and must be a string' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ answer: '⚠️ Error: Gemini API key not configured' });
    }

    const contextPrompt = `You are MOSDAC AI Help Bot, a helpful assistant specializing in space technology, satellite data, and remote sensing. You work for MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre).

Please provide helpful, accurate, and professional responses about:
- Satellite data and imagery
- Remote sensing applications
- Weather and climate monitoring
- Oceanographic data
- Space technology
- Data processing and analysis
- MOSDAC services and capabilities

User query: ${query}`;

    console.log('🚀 Sending request to Gemini API...');

    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(contextPrompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('Empty response from Gemini');

    console.log('✅ Gemini response received:', text.slice(0, 100) + '...');

    res.json({ answer: text });

  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    let msg = '⚠️ Error: Gemini not available';

    if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
      msg = '⚠️ Error: Invalid Gemini API key';
    } else if (error.message.includes('quota')) {
      msg = '⚠️ Error: Gemini API quota exceeded';
    } else if (error.message.includes('404')) {
      msg = '⚠️ Error: Model not found - using outdated model name';
    }

    res.json({ answer: msg });
  }
});

// ✅ Health check route
app.get('/api/health', (req, res) => {
  const status = {
    status: 'OK',
    service: 'MOSDAC AI Chat Backend',
    timestamp: new Date().toISOString(),
    geminiApiKey: process.env.GEMINI_API_KEY ? 'Configured' : 'Missing',
    port,
  };

  console.log('🏥 Health Check:', status);
  res.json(status);
});

// ✅ Start server
app.listen(port, () => {
  console.log('🚀 MOSDAC AI Chat Backend starting...');
  console.log(`📡 Running at http://localhost:${port}`);
  console.log(`🛰️ Gemini API Key Configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🔑 API Key (masked): ${maskApiKey(process.env.GEMINI_API_KEY)}`);
  console.log('✅ Ready to receive chat requests');
});``