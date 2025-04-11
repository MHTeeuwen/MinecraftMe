// Load environment variables
require('dotenv').config();

const { testMinimalImage, convertToMinecraftStyle } = require('./services/openai');
const fs = require('fs');
const path = require('path');

// Check if API key is loaded and log status (without revealing the key)
console.log('OpenAI API Key loaded:', !!process.env.OPENAI_API_KEY);

async function runTests() {
  try {
    console.log('\n=== Test 1: Minimal Image ===');
    const minimalResult = await testMinimalImage();
    console.log('Minimal image test successful!', minimalResult);
    
    // If minimal test succeeds, we can try with a real image file
    console.log('\n=== Test 2: Your Uploaded Image ===');
    // Note: You would need to provide the path to your image file
    // const imagePath = path.join(__dirname, 'your-test-image.jpg');
    // if (fs.existsSync(imagePath)) {
    //   const imageBase64 = fs.readFileSync(imagePath).toString('base64');
    //   const result = await convertToMinecraftStyle(imageBase64);
    //   console.log('Regular image test successful!', result);
    // } else {
    //   console.log('Test image not found, skipping Test 2');
    // }
  } catch (error) {
    console.error('Test failed:', error.message);
    
    if (error.timing) {
      console.error('Error occurred after:', error.timing.total, 'ms');
    }
  }
}

if (process.env.OPENAI_API_KEY) {
  runTests();
} else {
  console.error('ERROR: OPENAI_API_KEY environment variable is missing. Please set it before running tests.');
  console.log('You can set it temporarily by running:');
  console.log('  OPENAI_API_KEY=your_api_key node test-openai.js');
} 