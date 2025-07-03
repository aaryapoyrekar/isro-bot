// Knowledge Graph Builder utility for creating basic graphs from text
import fs from 'fs';

/**
 * Build a basic knowledge graph from text by splitting into sentences
 * Each sentence becomes a node, connected linearly to the next sentence
 * @param {string} text - Input text to process
 * @returns {Object} - Object containing nodes and edges arrays
 */
function buildGraphFromText(text) {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Input text must be a non-empty string');
    }

    // Clean and normalize the text
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    if (cleanText.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Split text into sentences using multiple delimiters
    // This regex looks for sentence endings followed by whitespace and capital letter
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .map(sentence => {
        // Ensure sentence ends with proper punctuation
        if (!/[.!?]$/.test(sentence)) {
          sentence += '.';
        }
        return sentence;
      });

    // If no sentences found, return empty graph
    if (sentences.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Create nodes from sentences
    const nodes = sentences.map((sentence, index) => ({
      id: `node_${index}`,
      label: `Sentence ${index + 1}`,
      text: sentence,
      index: index,
      wordCount: sentence.split(/\s+/).length,
      type: 'sentence'
    }));

    // Create linear edges connecting consecutive sentences
    const edges = [];
    for (let i = 0; i < sentences.length - 1; i++) {
      edges.push({
        id: `edge_${i}`,
        source: `node_${i}`,
        target: `node_${i + 1}`,
        type: 'sequence',
        weight: 1,
        label: `leads to`
      });
    }

    // Return the knowledge graph structure
    return {
      nodes,
      edges,
      metadata: {
        totalSentences: sentences.length,
        totalConnections: edges.length,
        averageWordsPerSentence: Math.round(
          sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / sentences.length
        ),
        graphType: 'linear_sequence'
      }
    };

  } catch (error) {
    console.error('Error building graph from text:', error.message);
    throw new Error(`Failed to build knowledge graph: ${error.message}`);
  }
}

/**
 * Build knowledge graph from a text file
 * @param {string} filePath - Path to the text file
 * @returns {Promise<Object>} - Object containing nodes and edges arrays
 */
async function buildGraphFromFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Text file not found: ${filePath}`);
    }

    // Read the file content
    const text = fs.readFileSync(filePath, 'utf-8');
    
    // Build graph from the text content
    return buildGraphFromText(text);
    
  } catch (error) {
    console.error('Error building graph from file:', error.message);
    throw new Error(`Failed to build knowledge graph from file: ${error.message}`);
  }
}

/**
 * Export graph to JSON file
 * @param {Object} graph - Graph object with nodes and edges
 * @param {string} outputPath - Path to save the JSON file
 */
function exportGraphToJSON(graph, outputPath) {
  try {
    const graphData = {
      ...graph,
      exportedAt: new Date().toISOString(),
      format: 'knowledge_graph_v1'
    };

    fs.writeFileSync(outputPath, JSON.stringify(graphData, null, 2), 'utf-8');
    console.log(`Knowledge graph exported to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error exporting graph:', error.message);
    throw new Error(`Failed to export graph: ${error.message}`);
  }
}

/**
 * Print graph statistics to console
 * @param {Object} graph - Graph object with nodes and edges
 */
function printGraphStats(graph) {
  console.log('\n📊 Knowledge Graph Statistics:');
  console.log(`├── Nodes: ${graph.nodes.length}`);
  console.log(`├── Edges: ${graph.edges.length}`);
  
  if (graph.metadata) {
    console.log(`├── Total Sentences: ${graph.metadata.totalSentences}`);
    console.log(`├── Total Connections: ${graph.metadata.totalConnections}`);
    console.log(`├── Avg Words/Sentence: ${graph.metadata.averageWordsPerSentence}`);
    console.log(`└── Graph Type: ${graph.metadata.graphType}`);
  }
  
  console.log('\n🔗 Sample Connections:');
  graph.edges.slice(0, 3).forEach(edge => {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    console.log(`├── "${sourceNode?.text.substring(0, 50)}..." → "${targetNode?.text.substring(0, 50)}..."`);
  });
}

// Export the functions using module.exports for CommonJS compatibility
module.exports = {
  buildGraphFromText,
  buildGraphFromFile,
  exportGraphToJSON,
  printGraphStats
};

// Also export as ES module for modern usage
export { 
  buildGraphFromText, 
  buildGraphFromFile, 
  exportGraphToJSON, 
  printGraphStats 
};