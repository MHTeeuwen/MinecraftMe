const express = require('express');
const router = express.Router();
const { testMinimalImage } = require('../services/openai');

router.get('/test-image', async (req, res) => {
  try {
    console.log('=== Running Minimal Image Test ===');
    const result = await testMinimalImage();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      status: error.status || 'unknown'
    });
  }
});

module.exports = router; 