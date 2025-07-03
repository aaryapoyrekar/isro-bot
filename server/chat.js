// server/chat.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runRAG } from './utils/rag.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config();

const app = express();
const port = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Load MOSDAC knowledge base
let mosdacKnowledgeBase = '';

try {
  const dataPath = path.join(__dirname, 'utils', 'data', 'mosdac_content.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const mosdacData = JSON.parse(rawData);
  mosdacKnowledgeBase = mosdacData.content || '';
  console.log('📚 MOSDAC knowledge base loaded successfully');
  console.log(`📄 Knowledge base size: ${mosdacKnowledgeBase.length} characters`);
} catch (error) {
  console.error('❌ Error loading MOSDAC knowledge base:', error.message);
  mosdacKnowledgeBase = `MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre) is India's premier facility for satellite data archival and distribution. Established by ISRO, MOSDAC serves as the central repository for meteorological and oceanographic satellite data. For detailed information, please visit the official MOSDAC website.`;
}

// ✅ Helper to mask API key in logs
const maskApiKey = (key) => {
  if (!key) return 'NOT_SET';
  if (key.length < 8) return 'INVALID_LENGTH';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

// ✅ POST route for chat using RAG system
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

    if (!mosdacKnowledgeBase) {
      return res.status(500).json({ answer: '⚠️ Error: MOSDAC knowledge base not available' });
    }

    console.log('🚀 Processing query with RAG system...');

    // Use RAG system with MOSDAC knowledge base
    const answer = await runRAG(mosdacKnowledgeBase, query, {
      chunkSize: 800,
      chunkOverlap: 150,
      topK: 4,
      temperature: 0.7,
      maxTokens: 1000
    });

    console.log('✅ RAG response generated successfully');
    console.log('📊 Response preview:', answer.slice(0, 100) + '...');

    res.json({ answer });

  } catch (error) {
    console.error('❌ RAG System Error:', error.message);
    let msg = '⚠️ Error: Unable to process your request at the moment';

    if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
      msg = '⚠️ Error: Invalid Gemini API key configuration';
    } else if (error.message.includes('quota')) {
      msg = '⚠️ Error: Gemini API quota exceeded';
    } else if (error.message.includes('model')) {
      msg = '⚠️ Error: AI model temporarily unavailable';
    } else if (error.message.includes('RAG')) {
      msg = '⚠️ Error: Knowledge retrieval system unavailable';
    }

    res.json({ answer: msg });
  }
});

// ✅ Health check route
app.get('/api/health', (req, res) => {
  const status = {
    status: 'OK',
    service: 'MOSDAC AI Chat Backend with RAG',
    timestamp: new Date().toISOString(),
    geminiApiKey: process.env.GEMINI_API_KEY ? 'Configured' : 'Missing',
    knowledgeBase: mosdacKnowledgeBase ? 'Loaded' : 'Missing',
    knowledgeBaseSize: mosdacKnowledgeBase.length,
    port,
  };

  console.log('🏥 Health Check:', status);
  res.json(status);
});

// ✅ Start server
app.listen(port, () => {
  console.log('🚀 MOSDAC AI Chat Backend with RAG starting...');
  console.log(`📡 Running at http://localhost:${port}`);
  console.log(`🛰️ Gemini API Key Configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🔑 API Key (masked): ${maskApiKey(process.env.GEMINI_API_KEY)}`);
  console.log(`📚 Knowledge Base Status: ${mosdacKnowledgeBase ? 'Loaded' : 'Missing'}`);
  console.log(`📄 Knowledge Base Size: ${mosdacKnowledgeBase.length} characters`);
  console.log('✅ Ready to receive chat requests with RAG-powered responses');
});