const express = require('express');
const router = express.Router();
const { convertToMinecraftStyle } = require('../services/openai');
const { validateConversionRequest } = require('../middleware/validation');
const { createError } = require('../utils/errors');

/**
 * POST /api/convert
 * Converts an image to Minecraft style using OpenAI
 */
router.post('/', validateConversionRequest, async (req, res, next) => {
  try {
    console.log('Received conversion request');
    const { image, prompt, size } = req.body;
    
    console.log('Request details:', {
      promptLength: prompt?.length,
      imageDataLength: image?.length,
      size
    });

    console.log('Starting image conversion...');
    const result = await convertToMinecraftStyle(image, prompt, size);
    
    console.log('Conversion successful, sending response:', {
      status: result.status,
      hasUrl: !!result.url,
      url: result.url ? result.url.substring(0, 50) + '...' : null
    });

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Conversion error details:', {
      message: error.message,
      stack: error.stack,
      status: error.status
    });
    next(error);
  }
});

module.exports = router;