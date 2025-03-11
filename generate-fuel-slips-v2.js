
import fs from 'fs';
import path from 'path';


// Import all utility functions from original file
import {
  generate,
} from './generate-fuel-slips.js';

// Load config function
async function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const configData = await fs.promises.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
}

async  function main(){
  const config = await loadConfig();
  generate(config).then(() => {
    console.log('Fuel slips generated successfully');
  }).catch((error) => {
    console.error('Error generating fuel slips:', error);
  });
}

// Start the script
main().catch(console.error);
