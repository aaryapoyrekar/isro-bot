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

/**
 * Test Gemini API connectivity
 * @returns {Promise<Object>} - API status information
 */
async function testGeminiAPI() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        status: 'error',
        message: 'API key not configured',
        accessible: false
      };
    }

    // Simple test with minimal content to check API accessibility
    const testResponse = await runRAG(
      'MOSDAC is a satellite data center.',
      'What is MOSDAC?',
      { chunkSize: 100, topK: 1, maxTokens: 50 }
    );

    return {
      status: 'success',
      message: 'API accessible and responding',
      accessible: true,
      testResponseLength: testResponse.length
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      accessible: false
    };
  }
}

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

// ✅ Enhanced Health check route with comprehensive backend and API status
app.get('/api/health', async (req, res) => {
  const healthCheckStart = Date.now();
  
  try {
    // Basic system status
    const basicStatus = {
      service: 'MOSDAC AI Chat Backend',
      version: '1.0.0',
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: port,
      nodeVersion: process.version,
      platform: process.platform
    };

    // Backend component status
    const backendStatus = {
      server: {
        status: 'running',
        port: port,
        environment: process.env.NODE_ENV || 'development'
      },
      knowledgeBase: {
        status: mosdacKnowledgeBase ? 'loaded' : 'missing',
        size: mosdacKnowledgeBase.length,
        available: !!mosdacKnowledgeBase
      },
      logging: {
        directory: {
          status: fs.existsSync(logsDir) ? 'available' : 'missing',
          path: logsDir
        },
        queryLog: {
          status: fs.existsSync(queryLogPath) ? 'available' : 'missing',
          path: queryLogPath
        }
      },
      fileSystem: {
        logsWritable: true,
        tempAccess: true
      }
    };

    // Gemini API status
    const geminiStatus = {
      apiKey: {
        configured: !!process.env.GEMINI_API_KEY,
        masked: maskApiKey(process.env.GEMINI_API_KEY),
        valid: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10
      },
      connectivity: {
        status: 'checking',
        accessible: false,
        lastChecked: new Date().toISOString()
      }
    };

    // Test Gemini API connectivity (with timeout)
    try {
      const apiTest = await Promise.race([
        testGeminiAPI(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API test timeout')), 5000)
        )
      ]);
      
      geminiStatus.connectivity = {
        ...geminiStatus.connectivity,
        ...apiTest,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      geminiStatus.connectivity = {
        status: 'error',
        accessible: false,
        message: error.message,
        lastChecked: new Date().toISOString()
      };
    }

    // Overall system health
    const overallHealth = {
      healthy: (
        backendStatus.server.status === 'running' &&
        backendStatus.knowledgeBase.available &&
        geminiStatus.apiKey.configured &&
        geminiStatus.connectivity.accessible
      ),
      issues: []
    };

    // Identify issues
    if (!backendStatus.knowledgeBase.available) {
      overallHealth.issues.push('Knowledge base not loaded');
    }
    if (!geminiStatus.apiKey.configured) {
      overallHealth.issues.push('Gemini API key not configured');
    }
    if (!geminiStatus.connectivity.accessible) {
      overallHealth.issues.push('Gemini API not accessible');
    }
    if (!backendStatus.logging.directory.status === 'available') {
      overallHealth.issues.push('Logging directory not available');
    }

    // Performance metrics
    const performanceMetrics = {
      healthCheckDuration: Date.now() - healthCheckStart,
      memoryUsage: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    // Compile complete health response
    const healthResponse = {
      ...basicStatus,
      health: overallHealth,
      backend: backendStatus,
      geminiAPI: geminiStatus,
      performance: performanceMetrics
    };

    // Log health check
    console.log('🏥 Health Check Completed:', {
      status: overallHealth.healthy ? 'HEALTHY' : 'ISSUES_DETECTED',
      issues: overallHealth.issues,
      duration: performanceMetrics.healthCheckDuration + 'ms'
    });

    // Return appropriate HTTP status
    const httpStatus = overallHealth.healthy ? 200 : 503;
    res.status(httpStatus).json(healthResponse);

  } catch (error) {
    console.error('❌ Health Check Error:', error.message);
    
    res.status(500).json({
      service: 'MOSDAC AI Chat Backend',
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      health: {
        healthy: false,
        issues: ['Health check system failure']
      }
    });
  }
});

// ✅ Route to get query logs (optional - for debugging/monitoring)
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