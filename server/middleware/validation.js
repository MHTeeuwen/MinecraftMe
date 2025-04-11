const { createError } = require('../utils/errors');

/**
 * Validates the request body for image conversion
 */
function validateConversionRequest(req, res, next) {
  try {
    const { image, prompt, size } = req.body;

    // Check if required fields are present
    if (!image) {
      throw createError('Image is required', 400);
    }

    if (!prompt) {
      throw createError('Prompt is required', 400);
    }

    // Validate image base64 string
    if (!isValidBase64(image)) {
      throw createError('Invalid base64 image format', 400);
    }

    // Validate image size
    const sizeInBytes = Buffer.from(image, 'base64').length;
    if (sizeInBytes > parseInt(process.env.MAX_FILE_SIZE)) {
      throw createError('Image size exceeds maximum allowed size', 400);
    }

    // Validate size parameter if provided
    if (size && !['256x256', '512x512', '1024x1024'].includes(size)) {
      throw createError('Invalid size parameter', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Checks if a string is valid base64
 */
function isValidBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

module.exports = {
  validateConversionRequest
}; 