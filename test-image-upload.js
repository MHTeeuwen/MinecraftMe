const { testMinimalImage } = require('./server/services/openai');

async function runTests() {
  console.log('=== Starting Image Upload Tests ===\n');

  try {
    console.log('Test 1: Minimal Image Test');
    console.log('----------------------------');
    const minimalResult = await testMinimalImage();
    console.log('Minimal image test result:', minimalResult);
  } catch (error) {
    console.error('Minimal image test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }

  console.log('\n=== Tests Complete ===');
}

runTests(); 