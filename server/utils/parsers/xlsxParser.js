// XLSX Parser utility for extracting data from Excel files
import fs from 'fs';
import XLSX from 'xlsx';

/**
 * Parse XLSX file and extract data from the first sheet as JSON
 * @param {string} filePath - Path to the .xlsx file
 * @returns {Promise<Array<Object>>} - Array of objects representing rows from the first sheet
 * @throws {Error} - If file doesn't exist or parsing fails
 */
async function parseXLSX(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`XLSX file not found: ${filePath}`);
    }

    // Check if file has .xlsx extension
    if (!filePath.toLowerCase().endsWith('.xlsx')) {
      throw new Error(`Invalid file type. Expected .xlsx file, got: ${filePath}`);
    }

    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet name
    const firstSheetName = workbook.SheetNames[0];
    
    if (!firstSheetName) {
      throw new Error('No sheets found in the Excel file');
    }

    // Get the first worksheet
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert worksheet to JSON
    // Using header: 1 to get array of arrays, then we'll convert to objects
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Default value for empty cells
      blankrows: false // Skip blank rows
    });

    // If no data found
    if (jsonData.length === 0) {
      return [];
    }

    // Convert array of arrays to array of objects
    // First row is assumed to be headers
    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    const result = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Use header as key, or fallback to column index if header is empty
        const key = header || `Column_${index + 1}`;
        obj[key] = row[index] || '';
      });
      return obj;
    });

    return result;
    
  } catch (error) {
    console.error('Error parsing XLSX:', error.message);
    throw new Error(`Failed to parse XLSX: ${error.message}`);
  }
}

// Export the function using module.exports for CommonJS compatibility
module.exports = {
  parseXLSX
};

// Also export as ES module for modern usage
export { parseXLSX };