// RAG (Retrieval-Augmented Generation) System using LangChain and Gemini
import dotenv from 'dotenv';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptTemplate } from '@langchain/core/prompts';

// Load environment variables
dotenv.config();

/**
 * RAG System for contextual question answering
 * Uses Gemini embeddings with MemoryVectorStore for document retrieval
 * @param {string} inputText - Long input text to use as knowledge base
 * @param {string} userQuery - User's question/query
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - Contextual answer based on retrieved documents
 */
async function runRAG(inputText, userQuery, options = {}) {
  try {
    // Validate inputs
    if (!inputText || typeof inputText !== 'string') {
      throw new Error('Input text must be a non-empty string');
    }
    
    if (!userQuery || typeof userQuery !== 'string') {
      throw new Error('User query must be a non-empty string');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    // Configuration options with defaults
    const config = {
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      topK: options.topK || 4,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000,
      ...options
    };

    console.log('🚀 Starting RAG process...');
    console.log(`📄 Input text length: ${inputText.length} characters`);
    console.log(`❓ User query: "${userQuery}"`);

    // Step 1: Split the input text into chunks
    console.log('📝 Splitting text into chunks...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });

    const documents = await textSplitter.createDocuments([inputText]);
    console.log(`✂️ Created ${documents.length} text chunks`);

    // Step 2: Initialize Gemini embeddings
    console.log('🧠 Initializing Gemini embeddings...');
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'embedding-001', // Gemini embedding model
    });

    // Step 3: Create vector store from documents
    console.log('🗄️ Creating vector store...');
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );

    // Step 4: Perform similarity search
    console.log('🔍 Performing similarity search...');
    const relevantDocs = await vectorStore.similaritySearch(
      userQuery,
      config.topK
    );

    console.log(`📋 Found ${relevantDocs.length} relevant document chunks`);

    // Step 5: Prepare context from retrieved documents
    const context = relevantDocs
      .map((doc, index) => `[Context ${index + 1}]\n${doc.pageContent}`)
      .join('\n\n');

    // Step 6: Create prompt template for RAG
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context.

Context Information:
{context}

User Question: {question}

Instructions:
- Answer the question using ONLY the information provided in the context above
- If the context doesn't contain enough information to answer the question, say so clearly
- Be specific and cite relevant parts of the context when possible
- Keep your answer concise but comprehensive
- If multiple perspectives exist in the context, present them fairly

Answer:`);

    const prompt = await promptTemplate.format({
      context: context,
      question: userQuery
    });

    // Step 7: Generate answer using Gemini
    console.log('🤖 Generating contextual answer...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      }
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // Step 8: Prepare response with metadata
    const response = {
      answer: answer.trim(),
      metadata: {
        chunksRetrieved: relevantDocs.length,
        totalChunks: documents.length,
        contextLength: context.length,
        queryLength: userQuery.length,
        processingTime: Date.now(),
        model: 'gemini-1.5-flash',
        embeddingModel: 'embedding-001'
      },
      retrievedChunks: relevantDocs.map((doc, index) => ({
        index: index + 1,
        content: doc.pageContent.substring(0, 200) + '...',
        length: doc.pageContent.length
      }))
    };

    console.log('✅ RAG process completed successfully');
    console.log(`📊 Answer length: ${answer.length} characters`);

    return response.answer;

  } catch (error) {
    console.error('❌ RAG Error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('API_KEY')) {
      throw new Error('❌ Gemini API key is missing or invalid. Please check your GEMINI_API_KEY environment variable.');
    } else if (error.message.includes('quota')) {
      throw new Error('❌ Gemini API quota exceeded. Please check your usage limits.');
    } else if (error.message.includes('model')) {
      throw new Error('❌ Gemini model error. The specified model may not be available.');
    } else {
      throw new Error(`❌ RAG system error: ${error.message}`);
    }
  }
}

/**
 * Advanced RAG function with custom retrieval strategies
 * @param {string} inputText - Long input text to use as knowledge base
 * @param {string} userQuery - User's question/query
 * @param {Object} options - Advanced configuration options
 * @returns {Promise<Object>} - Detailed response with answer and metadata
 */
async function runAdvancedRAG(inputText, userQuery, options = {}) {
  try {
    const config = {
      chunkSize: options.chunkSize || 800,
      chunkOverlap: options.chunkOverlap || 150,
      topK: options.topK || 5,
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 1500,
      includeMetadata: options.includeMetadata !== false,
      ...options
    };

    // Run the basic RAG process
    const answer = await runRAG(inputText, userQuery, config);

    // If metadata is not requested, return just the answer
    if (!config.includeMetadata) {
      return answer;
    }

    // Return detailed response with metadata
    return {
      answer,
      query: userQuery,
      timestamp: new Date().toISOString(),
      config: {
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
        topK: config.topK,
        temperature: config.temperature
      }
    };

  } catch (error) {
    console.error('❌ Advanced RAG Error:', error.message);
    throw error;
  }
}

/**
 * Batch RAG processing for multiple queries
 * @param {string} inputText - Long input text to use as knowledge base
 * @param {Array<string>} queries - Array of user queries
 * @param {Object} options - Configuration options
 * @returns {Promise<Array<Object>>} - Array of answers with metadata
 */
async function runBatchRAG(inputText, queries, options = {}) {
  try {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('Queries must be a non-empty array');
    }

    console.log(`🔄 Processing ${queries.length} queries in batch...`);

    const results = [];
    for (let i = 0; i < queries.length; i++) {
      console.log(`📝 Processing query ${i + 1}/${queries.length}`);
      
      try {
        const answer = await runRAG(inputText, queries[i], options);
        results.push({
          query: queries[i],
          answer,
          index: i + 1,
          status: 'success'
        });
      } catch (error) {
        results.push({
          query: queries[i],
          answer: null,
          error: error.message,
          index: i + 1,
          status: 'error'
        });
      }
    }

    console.log('✅ Batch RAG processing completed');
    return results;

  } catch (error) {
    console.error('❌ Batch RAG Error:', error.message);
    throw error;
  }
}

// Export the functions using module.exports for CommonJS compatibility
module.exports = {
  runRAG,
  runAdvancedRAG,
  runBatchRAG
};

// Also export as ES module for modern usage
export { 
  runRAG, 
  runAdvancedRAG, 
  runBatchRAG 
};