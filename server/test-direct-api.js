// Load environment variables
require('dotenv').config();

const { testMinimalImage } = require('./services/openai');

async function runTest() {
  console.log('Starting minimal image test with direct API call...');
  
  try {
    const result = await testMinimalImage();
    console.log('Test successful!', result);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest(); 