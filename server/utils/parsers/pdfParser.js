// PDF Parser utility for extracting text content from PDF files
import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Parse PDF file and extract text content
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content from the PDF
 * @throws {Error} - If file doesn't exist or parsing fails
 */
async function parsePDF(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    // Read the PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF buffer
    const data = await pdf(dataBuffer);
    
    // Return the extracted text content
    return data.text;
    
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

// Export the function using module.exports for CommonJS compatibility
module.exports = {
  parsePDF
};

// Also export as ES module for modern usage
export { parsePDF };