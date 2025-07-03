// Test script for RAG system with MOSDAC knowledge base
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runRAG } from './utils/rag.js';
import dotenv from 'dotenv';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Test RAG system with MOSDAC knowledge base
 */
async function testRAGSystem() {
  console.log('🚀 Starting RAG Test Script...\n');

  try {
    // Step 1: Load MOSDAC content from JSON file
    console.log('📚 Loading MOSDAC knowledge base...');
    const dataPath = path.join(__dirname, 'utils', 'data', 'mosdac_content.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error(`MOSDAC content file not found: ${dataPath}`);
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const mosdacData = JSON.parse(rawData);
    const knowledgeBase = mosdacData.content;

    console.log('✅ MOSDAC knowledge base loaded successfully');
    console.log(`📄 Content length: ${knowledgeBase.length} characters`);
    console.log(`📊 Topics covered: ${mosdacData.metadata.topics.join(', ')}`);
    console.log(`📅 Last updated: ${mosdacData.metadata.lastUpdated}\n`);

    // Step 2: Prepare the test query
    const testQuery = "What is INSAT-3D?";
    console.log(`❓ Test Query: "${testQuery}"\n`);

    // Step 3: Check API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in your .env file.');
    }

    console.log('🔑 Gemini API Key: Configured ✅\n');

    // Step 4: Run RAG system
    console.log('🤖 Running RAG system...');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    
    const response = await runRAG(knowledgeBase, testQuery, {
      chunkSize: 800,
      chunkOverlap: 150,
      topK: 4,
      temperature: 0.7,
      maxTokens: 1000
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log('=' .repeat(50));
    console.log('✅ RAG processing completed!\n');

    // Step 5: Display results
    console.log('📋 RESULTS:');
    console.log('=' .repeat(50));
    console.log(`Query: ${testQuery}`);
    console.log(`Processing Time: ${processingTime}ms`);
    console.log(`Response Length: ${response.length} characters\n`);
    
    console.log('🤖 RAG Response:');
    console.log('-' .repeat(50));
    console.log(response);
    console.log('-' .repeat(50));

    // Step 6: Additional analysis
    console.log('\n📊 Analysis:');
    console.log(`• Response contains "INSAT-3D": ${response.includes('INSAT-3D') ? 'Yes ✅' : 'No ❌'}`);
    console.log(`• Response contains "satellite": ${response.includes('satellite') ? 'Yes ✅' : 'No ❌'}`);
    console.log(`• Response contains "meteorological": ${response.includes('meteorological') ? 'Yes ✅' : 'No ❌'}`);
    console.log(`• Response contains "ISRO": ${response.includes('ISRO') ? 'Yes ✅' : 'No ❌'}`);

    // Step 7: Save results to file
    const resultsPath = path.join(__dirname, 'logs', 'rag_test_results.json');
    const resultsData = {
      timestamp: new Date().toISOString(),
      query: testQuery,
      response: response,
      processingTime: processingTime,
      knowledgeBaseSize: knowledgeBase.length,
      responseLength: response.length,
      config: {
        chunkSize: 800,
        chunkOverlap: 150,
        topK: 4,
        temperature: 0.7,
        maxTokens: 1000
      },
      analysis: {
        containsINSAT3D: response.includes('INSAT-3D'),
        containsSatellite: response.includes('satellite'),
        containsMeteorological: response.includes('meteorological'),
        containsISRO: response.includes('ISRO')
      }
    };

    // Ensure logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2), 'utf-8');
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    console.log('\n🎉 RAG test completed successfully!');

  } catch (error) {
    console.error('\n❌ RAG Test Error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('\n💡 Solution: Create a .env file in the project root with:');
      console.log('GEMINI_API_KEY=your_actual_google_gemini_api_key');
    } else if (error.message.includes('not found')) {
      console.log('\n💡 Solution: Ensure the MOSDAC content file exists at:');
      console.log(path.join(__dirname, 'utils', 'data', 'mosdac_content.json'));
    } else if (error.message.includes('quota')) {
      console.log('\n💡 Solution: Check your Gemini API quota and usage limits');
    }
    
    process.exit(1);
  }
}

// Export the test function
export { testRAGSystem };

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRAGSystem();
}