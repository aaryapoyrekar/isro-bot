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
You are MOSDAC AI Help Bot, a helpful assistant specializing in space technology, satellite data, and remote sensing. You work for MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre).

Context Information:
{context}

User Question: {question}

Instructions:
- Answer the question using the information provided in the context above
- Focus on MOSDAC services, satellite data, remote sensing, and space technology
- If the context doesn't contain enough information to answer the question, provide general knowledge about MOSDAC and suggest contacting MOSDAC directly
- Be specific and cite relevant parts of the context when possible
- Keep your answer helpful, professional, and informative
- If multiple perspectives exist in the context, present them clearly

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

    console.log('✅ RAG process completed successfully');
    console.log(`📊 Answer length: ${answer.length} characters`);

    return answer.trim();

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

// Export the function using module.exports for CommonJS compatibility
module.exports = {
  runRAG
};

// Also export as ES module for modern usage
export { runRAG };