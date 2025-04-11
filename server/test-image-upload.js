const { testMinimalImage, convertToMinecraftStyle } = require('./services/openai');

async function runTests() {
  console.log('=== Starting Image Upload Tests ===\n');

  try {
    console.log('Test 1: Minimal Image Test');
    console.log('----------------------------');
    const minimalResult = await testMinimalImage();
    console.log('Minimal image test result:', minimalResult);
  } catch (error) {
    console.error('Minimal image test failed:', error);
  }

  console.log('\n=== Tests Complete ===');
}

runTests(); 