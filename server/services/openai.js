const sharp = require('sharp');
const { createError } = require('../utils/errors');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Compress and resize image to meet OpenAI's requirements
 */
async function prepareImage(base64Image) {
  try {
    const buffer = Buffer.from(base64Image, 'base64');
    console.log('Original buffer size:', buffer.length);
    
    const metadata = await sharp(buffer).metadata();
    console.log('Image metadata:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length
    });
    
    const processedBuffer = await sharp(buffer)
      .resize(512, 512, { // 512x512 for better detail
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();
    
    const processedMetadata = await sharp(processedBuffer).metadata();
    console.log('Processed image:', {
      format: processedMetadata.format,
      width: processedMetadata.width,
      height: processedMetadata.height,
      size: processedBuffer.length,
      channels: processedMetadata.channels
    });
    
    if (processedBuffer.length > 4 * 1024 * 1024) {
      throw new Error('Processed image exceeds 4MB limit for OpenAI API');
    }
    
    return processedBuffer;
  } catch (error) {
    console.error('Image preparation failed:', error);
    throw createError('Failed to prepare image: ' + error.message, 500);
  }
}

/**
 * Converts an image to Minecraft style using OpenAI's vision and generation APIs
 */
async function convertToMinecraftStyle(base64Image, prompt, size = '1024x1024') {
  const startTime = Date.now();
  
  try {
    logger.info('Starting image conversion process');
    console.log('=== Enhanced Image Conversion Process ===');
    console.log(`[${Date.now() - startTime}ms] 1. Processing image...`);
    
    const processedImage = await prepareImage(base64Image);
    const imageSize = processedImage.length;
    console.log(`[${Date.now() - startTime}ms] 2. Image processed, size: ${processedImage.length} bytes`);
    
    const base64Processed = processedImage.toString('base64');
    console.log(`[${Date.now() - startTime}ms] 3. Sending to OpenAI Vision API for description...`);

    // Step 1: Use vision API to describe the image in Minecraft style
    const visionStartTime = Date.now();
    const visionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt || 'Provide a concise description of the main subject in this image as a Minecraft character with blocky, pixelated features, cubic limbs, and a simplified color palette. Include specific details about their appearance, clothing, accessories, and any objects they are holding or interacting with. Do not provide instructions or steps.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64Processed}` }
            }
          ]
        }
      ],
      max_tokens: 150, // Reduced to ensure a concise description
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000,
    });
    
    const visionTime = Date.now() - visionStartTime;
    logger.info('Vision API response received', { processingTime: visionTime });

    let description = visionResponse.data.choices[0].message.content;
    console.log(`[${Date.now() - startTime}ms] 4. Vision API description received:`, description);

    // Truncate the description to ensure the total prompt length is under 1000 characters
    const prefix = "A Minecraft character based on this description: ";
    const maxDescriptionLength = 1000 - prefix.length; // Leave room for the prefix
    if (description.length > maxDescriptionLength) {
      description = description.substring(0, maxDescriptionLength);
      console.log(`[${Date.now() - startTime}ms] Description truncated to ${description.length} characters`);
    }

    // Step 2: Use image generation API to create the Minecraft-style image
    console.log(`[${Date.now() - startTime}ms] 5. Sending description to OpenAI Image Generation API...`);
    const generationResponse = await axios.post('https://api.openai.com/v1/images/generations', {
      prompt: `${prefix}${description}`,
      n: 1,
      size: size,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000,
    });

    console.log(`[${Date.now() - startTime}ms] 6. Image generation API response received`);
    
    logger.trackConversion('success', Date.now() - startTime, imageSize);
    
    return {
      url: generationResponse.data.data[0].url,
      status: 'success',
      timing: { total: Date.now() - startTime, unit: 'ms' }
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${totalTime}ms] Error during calling OpenAI API:`, error);
    
    // Log the error
    logger.error('OpenAI API error', {
      error: error.message,
      statusCode: error.response?.status,
      processingTime: totalTime,
      responseData: error.response?.data?.error
    });
    
    // Track failed conversion
    logger.trackConversion('error', totalTime, 0);
    
    throw createError(
      `Failed during calling OpenAI API: ${error.response?.status} ${error.response?.data?.error?.message || error.message}`,
      error.response?.status || 500
    );
  }
}

module.exports = {
  convertToMinecraftStyle
};