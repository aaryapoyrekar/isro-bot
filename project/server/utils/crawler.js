// 🛰️ This script crawls static HTML content from MOSDAC and saves it as JSON

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Example MOSDAC URL (replace with actual target)
const MOSDAC_URL = 'https://www.mosdac.gov.in/';

// Output file path
const OUTPUT_PATH = path.resolve(__dirname, 'data', 'mosdac_content.json');

async function crawlMosdac() {
  console.log("🚀 Crawler function started...");
  try {
    // Fetch the HTML content
    const response = await axios.get(MOSDAC_URL);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Example: Extract all links and their text
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.textContent.trim(),
    }));

    // Save as JSON
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ links }, null, 2), 'utf-8');

    console.log(`✅ Crawled and saved ${links.length} links from MOSDAC.`);
  } catch (error) {
    console.error('❌ Error crawling MOSDAC:', error.message);
  }
}

// Run the crawler if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlMosdac();
}