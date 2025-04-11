/**
 * Validates required environment variables
 */
function validateEnv() {
  const required = {
    // Server
    PORT: process.env.PORT || '3001',
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // APIs
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    
    // URLs
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || 'http://localhost:3001',
    
    // Limits
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5242880',
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '50'
  };

  const missing = [];
  
  // In production, ensure all keys are set
  if (process.env.NODE_ENV === 'production') {
    for (const [key, value] of Object.entries(required)) {
      if (!value && key !== 'PORT' && key !== 'NODE_ENV') {
        missing.push(key);
      }
    }
  } else {
    // In development, only check critical keys
    const critical = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY'];
    for (const key of critical) {
      if (!required[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return required;
}

module.exports = validateEnv; 