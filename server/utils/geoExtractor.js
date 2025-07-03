// Geographic Location Extractor utility for extracting latitude and longitude coordinates from text
import fs from 'fs';

/**
 * Extract latitude and longitude coordinates from text using regex patterns
 * Supports various coordinate formats commonly found in text
 * @param {string} text - Input text to search for coordinates
 * @returns {Array<Object>} - Array of {lat, lon} objects with extracted coordinates
 * @throws {Error} - If input text is invalid
 */
function extractGeoLocations(text) {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Input text must be a non-empty string');
    }

    const coordinates = [];

    // Regex patterns for different coordinate formats
    const patterns = [
      // Pattern 1: Decimal degrees (DD.dddd)
      // Examples: 28.6139, 77.2090 | -34.6037, -58.3816 | 40.7128°N, 74.0060°W
      {
        regex: /(-?\d{1,3}(?:\.\d+)?)\s*[°]?\s*([NS])?\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*[°]?\s*([EW])?/gi,
        type: 'decimal_degrees'
      },

      // Pattern 2: Degrees, Minutes, Seconds (DMS)
      // Examples: 40°42'46"N 74°00'21"W | 28°36'50"N, 77°12'32"E
      {
        regex: /(\d{1,3})[°]\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)[″"]\s*([NS])\s*[,\s]*\s*(\d{1,3})[°]\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)[″"]\s*([EW])/gi,
        type: 'dms'
      },

      // Pattern 3: Degrees and Minutes (DM)
      // Examples: 40°42.767'N 74°00.350'W | 28°36.833'N, 77°12.533'E
      {
        regex: /(\d{1,3})[°]\s*(\d{1,2}(?:\.\d+)?)['′]\s*([NS])\s*[,\s]*\s*(\d{1,3})[°]\s*(\d{1,2}(?:\.\d+)?)['′]\s*([EW])/gi,
        type: 'dm'
      },

      // Pattern 4: Simple decimal coordinates without direction indicators
      // Examples: 28.6139, 77.2090 | -34.6037, -58.3816
      {
        regex: /(-?\d{1,3}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)/g,
        type: 'simple_decimal'
      },

      // Pattern 5: Coordinates with explicit lat/lon labels
      // Examples: lat: 28.6139, lon: 77.2090 | latitude=40.7128, longitude=-74.0060
      {
        regex: /(?:lat(?:itude)?[:=]\s*(-?\d{1,3}(?:\.\d+)?)).*?(?:lon(?:gitude)?[:=]\s*(-?\d{1,3}(?:\.\d+)?))/gi,
        type: 'labeled'
      }
    ];

    // Process each pattern
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        let lat, lon;

        switch (pattern.type) {
          case 'decimal_degrees':
            lat = parseFloat(match[1]);
            lon = parseFloat(match[3]);
            
            // Handle direction indicators (N/S for latitude, E/W for longitude)
            if (match[2] && match[2].toUpperCase() === 'S') lat = -Math.abs(lat);
            if (match[4] && match[4].toUpperCase() === 'W') lon = -Math.abs(lon);
            break;

          case 'dms':
            // Convert DMS to decimal degrees
            const latDeg = parseInt(match[1]);
            const latMin = parseInt(match[2]);
            const latSec = parseFloat(match[3]);
            const latDir = match[4].toUpperCase();
            
            const lonDeg = parseInt(match[5]);
            const lonMin = parseInt(match[6]);
            const lonSec = parseFloat(match[7]);
            const lonDir = match[8].toUpperCase();
            
            lat = latDeg + (latMin / 60) + (latSec / 3600);
            lon = lonDeg + (lonMin / 60) + (lonSec / 3600);
            
            if (latDir === 'S') lat = -lat;
            if (lonDir === 'W') lon = -lon;
            break;

          case 'dm':
            // Convert DM to decimal degrees
            const latDegDM = parseInt(match[1]);
            const latMinDM = parseFloat(match[2]);
            const latDirDM = match[3].toUpperCase();
            
            const lonDegDM = parseInt(match[4]);
            const lonMinDM = parseFloat(match[5]);
            const lonDirDM = match[6].toUpperCase();
            
            lat = latDegDM + (latMinDM / 60);
            lon = lonDegDM + (lonMinDM / 60);
            
            if (latDirDM === 'S') lat = -lat;
            if (lonDirDM === 'W') lon = -lon;
            break;

          case 'simple_decimal':
            lat = parseFloat(match[1]);
            lon = parseFloat(match[2]);
            break;

          case 'labeled':
            lat = parseFloat(match[1]);
            lon = parseFloat(match[2]);
            break;
        }

        // Validate coordinate ranges
        if (isValidCoordinate(lat, lon)) {
          // Round to 6 decimal places for precision
          lat = Math.round(lat * 1000000) / 1000000;
          lon = Math.round(lon * 1000000) / 1000000;
          
          // Check for duplicates
          const isDuplicate = coordinates.some(coord => 
            Math.abs(coord.lat - lat) < 0.000001 && 
            Math.abs(coord.lon - lon) < 0.000001
          );
          
          if (!isDuplicate) {
            coordinates.push({
              lat,
              lon,
              format: pattern.type,
              originalText: match[0].trim()
            });
          }
        }
      }
    });

    // Sort coordinates by latitude (north to south)
    coordinates.sort((a, b) => b.lat - a.lat);

    console.log(`🌍 Extracted ${coordinates.length} unique coordinate pairs from text`);
    
    return coordinates.map(coord => ({
      lat: coord.lat,
      lon: coord.lon
    }));

  } catch (error) {
    console.error('❌ Error extracting geo locations:', error.message);
    throw new Error(`Failed to extract geo locations: ${error.message}`);
  }
}

/**
 * Validate if coordinates are within valid ranges
 * @param {number} lat - Latitude value
 * @param {number} lon - Longitude value
 * @returns {boolean} - True if coordinates are valid
 */
function isValidCoordinate(lat, lon) {
  return (
    typeof lat === 'number' && 
    typeof lon === 'number' &&
    !isNaN(lat) && 
    !isNaN(lon) &&
    lat >= -90 && 
    lat <= 90 &&
    lon >= -180 && 
    lon <= 180
  );
}

/**
 * Extract geo locations from a text file
 * @param {string} filePath - Path to the text file
 * @returns {Promise<Array<Object>>} - Array of {lat, lon} objects
 */
async function extractGeoLocationsFromFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Text file not found: ${filePath}`);
    }

    // Read the file content
    const text = fs.readFileSync(filePath, 'utf-8');
    
    // Extract coordinates from the text content
    return extractGeoLocations(text);
    
  } catch (error) {
    console.error('❌ Error extracting geo locations from file:', error.message);
    throw new Error(`Failed to extract geo locations from file: ${error.message}`);
  }
}

/**
 * Format coordinates for display
 * @param {Array<Object>} coordinates - Array of {lat, lon} objects
 * @returns {Array<string>} - Array of formatted coordinate strings
 */
function formatCoordinates(coordinates) {
  return coordinates.map(coord => {
    const latDir = coord.lat >= 0 ? 'N' : 'S';
    const lonDir = coord.lon >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(coord.lat).toFixed(6);
    const lonAbs = Math.abs(coord.lon).toFixed(6);
    
    return `${latAbs}°${latDir}, ${lonAbs}°${lonDir}`;
  });
}

/**
 * Get bounding box for a set of coordinates
 * @param {Array<Object>} coordinates - Array of {lat, lon} objects
 * @returns {Object} - Bounding box with north, south, east, west values
 */
function getBoundingBox(coordinates) {
  if (coordinates.length === 0) {
    return null;
  }

  const lats = coordinates.map(coord => coord.lat);
  const lons = coordinates.map(coord => coord.lon);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lons),
    west: Math.min(...lons),
    center: {
      lat: (Math.max(...lats) + Math.min(...lats)) / 2,
      lon: (Math.max(...lons) + Math.min(...lons)) / 2
    }
  };
}

// Export the functions using module.exports for CommonJS compatibility
module.exports = {
  extractGeoLocations,
  extractGeoLocationsFromFile,
  formatCoordinates,
  getBoundingBox,
  isValidCoordinate
};

// Also export as ES module for modern usage
export { 
  extractGeoLocations, 
  extractGeoLocationsFromFile, 
  formatCoordinates, 
  getBoundingBox, 
  isValidCoordinate 
};