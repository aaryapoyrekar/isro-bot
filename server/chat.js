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

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('📁 Created logs directory');
}

// Query log file path
const queryLogPath = path.join(logsDir, 'query_log.json');

// Initialize log file if it doesn't exist
if (!fs.existsSync(queryLogPath)) {
  fs.writeFileSync(queryLogPath, '', 'utf-8');
  console.log('📝 Initialized query log file');
}

/**
 * Log query and response to JSON file
 * @param {string} query - User query
 * @param {string} response - Bot response
 * @param {string} status - Request status (success/error)
 */
function logQuery(query, response, status = 'success') {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      query: query,
      response: response,
      status: status,
      responseLength: response.length,
      sessionId: Date.now().toString() // Simple session identifier
    };

    // Convert log entry to JSON string with newline
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Append to log file
    fs.appendFileSync(queryLogPath, logLine, 'utf-8');
    
    console.log('📝 Query logged successfully');
  } catch (error) {
    console.error('❌ Error logging query:', error.message);
  }
}

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

// ✅ POST route for chat using RAG system with logging
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  let userQuery = '';
  let botResponse = '';
  let requestStatus = 'error';

  try {
    const { query } = req.body;
    userQuery = query || '';

    console.log('📨 Incoming chat request:', {
      query: userQuery,
      timestamp: new Date().toISOString(),
    });

    console.log('🔑 Gemini API Key status:', maskApiKey(process.env.GEMINI_API_KEY));

    if (!query || typeof query !== 'string') {
      botResponse = '❌ Query is required and must be a string';
      logQuery(userQuery, botResponse, 'validation_error');
      return res.status(400).json({ error: botResponse });
    }

    if (!process.env.GEMINI_API_KEY) {
      botResponse = '⚠️ Error: Gemini API key not configured';
      logQuery(userQuery, botResponse, 'config_error');
      return res.status(500).json({ answer: botResponse });
    }

    if (!mosdacKnowledgeBase) {
      botResponse = '⚠️ Error: MOSDAC knowledge base not available';
      logQuery(userQuery, botResponse, 'knowledge_base_error');
      return res.status(500).json({ answer: botResponse });
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

    botResponse = answer;
    requestStatus = 'success';

    const processingTime = Date.now() - startTime;
    console.log('✅ RAG response generated successfully');
    console.log(`⏱️ Processing time: ${processingTime}ms`);
    console.log('📊 Response preview:', answer.slice(0, 100) + '...');

    // Log successful query and response
    logQuery(userQuery, botResponse, requestStatus);

    res.json({ answer: botResponse });

  } catch (error) {
    console.error('❌ RAG System Error:', error.message);
    
    let msg = '⚠️ Error: Unable to process your request at the moment';

    if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
      msg = '⚠️ Error: Invalid Gemini API key configuration';
      requestStatus = 'auth_error';
    } else if (error.message.includes('quota')) {
      msg = '⚠️ Error: Gemini API quota exceeded';
      requestStatus = 'quota_error';
    } else if (error.message.includes('model')) {
      msg = '⚠️ Error: AI model temporarily unavailable';
      requestStatus = 'model_error';
    } else if (error.message.includes('RAG')) {
      msg = '⚠️ Error: Knowledge retrieval system unavailable';
      requestStatus = 'rag_error';
    } else {
      requestStatus = 'system_error';
    }

    botResponse = msg;
    
    // Log error query and response
    logQuery(userQuery, botResponse, requestStatus);

    res.json({ answer: botResponse });
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
    logsDirectory: fs.existsSync(logsDir) ? 'Available' : 'Missing',
    queryLogFile: fs.existsSync(queryLogPath) ? 'Available' : 'Missing',
    port,
  };

  console.log('🏥 Health Check:', status);
  res.json(status);
});

// ✅ New route to get query logs (optional - for debugging/monitoring)
app.get('/api/logs', (req, res) => {
  try {
    if (!fs.existsSync(queryLogPath)) {
      return res.json({ logs: [], message: 'No logs available' });
    }

    const logContent = fs.readFileSync(queryLogPath, 'utf-8');
    const logLines = logContent.trim().split('\n').filter(line => line.length > 0);
    
    const logs = logLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { error: 'Invalid log entry', raw: line };
      }
    });

    // Return last 50 logs for performance
    const recentLogs = logs.slice(-50);

    res.json({
      totalLogs: logs.length,
      recentLogs: recentLogs,
      logFile: queryLogPath
    });

  } catch (error) {
    console.error('❌ Error reading logs:', error.message);
    res.status(500).json({ error: 'Unable to read logs' });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log('🚀 MOSDAC AI Chat Backend with RAG starting...');
  console.log(`📡 Running at http://localhost:${port}`);
  console.log(`🛰️ Gemini API Key Configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🔑 API Key (masked): ${maskApiKey(process.env.GEMINI_API_KEY)}`);
  console.log(`📚 Knowledge Base Status: ${mosdacKnowledgeBase ? 'Loaded' : 'Missing'}`);
  console.log(`📄 Knowledge Base Size: ${mosdacKnowledgeBase.length} characters`);
  console.log(`📝 Query Logging: ${fs.existsSync(queryLogPath) ? 'Enabled' : 'Disabled'}`);
  console.log(`📁 Logs Directory: ${logsDir}`);
  console.log('✅ Ready to receive chat requests with RAG-powered responses and logging');
});