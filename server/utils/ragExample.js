// Example usage of the RAG system
import { runRAG, runAdvancedRAG, runBatchRAG } from './ragSystem.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example function demonstrating RAG usage
 */
async function demonstrateRAG() {
  // Sample long text about space technology
  const sampleText = `
    MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre) is India's premier facility for satellite data archival and distribution. Established by ISRO, MOSDAC serves as the central repository for meteorological and oceanographic satellite data.

    The center processes data from various Indian satellites including INSAT series, Oceansat, Scatsat-1, and international satellites. MOSDAC provides near real-time data products for weather forecasting, cyclone monitoring, and climate studies.

    Key services include:
    1. Data archival and retrieval systems
    2. Near real-time data dissemination
    3. Value-added products for weather and ocean applications
    4. Training and capacity building programs
    5. Research and development in satellite meteorology

    MOSDAC supports various user communities including meteorological departments, research institutions, and operational agencies. The center maintains high-quality standards for data processing and ensures continuous availability of critical satellite data for weather and climate applications.

    Recent developments include advanced data processing algorithms, machine learning applications for weather prediction, and enhanced data visualization tools. MOSDAC continues to evolve with technological advancements to better serve the scientific community.
  `;

  console.log('🚀 RAG System Demonstration\n');

  try {
    // Example 1: Basic RAG query
    console.log('📋 Example 1: Basic RAG Query');
    const query1 = "What services does MOSDAC provide?";
    const answer1 = await runRAG(sampleText, query1);
    console.log(`Query: ${query1}`);
    console.log(`Answer: ${answer1}\n`);

    // Example 2: Advanced RAG with metadata
    console.log('📋 Example 2: Advanced RAG with Metadata');
    const query2 = "What satellites does MOSDAC process data from?";
    const result2 = await runAdvancedRAG(sampleText, query2, {
      topK: 3,
      temperature: 0.5,
      includeMetadata: true
    });
    console.log(`Query: ${query2}`);
    console.log(`Answer: ${result2.answer}`);
    console.log(`Config: ${JSON.stringify(result2.config, null, 2)}\n`);

    // Example 3: Batch processing
    console.log('📋 Example 3: Batch RAG Processing');
    const queries = [
      "What is MOSDAC?",
      "What are the recent developments at MOSDAC?",
      "Who are the users of MOSDAC services?"
    ];
    
    const batchResults = await runBatchRAG(sampleText, queries, {
      topK: 2,
      temperature: 0.4
    });

    batchResults.forEach(result => {
      console.log(`Query ${result.index}: ${result.query}`);
      console.log(`Status: ${result.status}`);
      if (result.status === 'success') {
        console.log(`Answer: ${result.answer.substring(0, 200)}...\n`);
      } else {
        console.log(`Error: ${result.error}\n`);
      }
    });

  } catch (error) {
    console.error('❌ Demonstration Error:', error.message);
  }
}

// Export the demonstration function
export { demonstrateRAG };

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateRAG();
}