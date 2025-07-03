// DOCX Parser utility for extracting text content from .docx files
import fs from 'fs';
import mammoth from 'mammoth';

/**
 * Parse DOCX file and extract plain text content
 * @param {string} filePath - Path to the .docx file
 * @returns {Promise<string>} - Extracted plain text content from the DOCX
 * @throws {Error} - If file doesn't exist or parsing fails
 */
async function parseDOCX(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`DOCX file not found: ${filePath}`);
    }

    // Check if file has .docx extension
    if (!filePath.toLowerCase().endsWith('.docx')) {
      throw new Error(`Invalid file type. Expected .docx file, got: ${filePath}`);
    }

    // Extract text from DOCX file
    const result = await mammoth.extractRawText({ path: filePath });
    
    // Return the extracted plain text content
    return result.value;
    
  } catch (error) {
    console.error('Error parsing DOCX:', error.message);
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
}

// Export the function using module.exports for CommonJS compatibility
module.exports = {
  parseDOCX
};

// Also export as ES module for modern usage
export { parseDOCX };