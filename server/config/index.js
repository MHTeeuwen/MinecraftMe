// Server configuration
require('dotenv').config();
const productionConfig = require('./production');

/**
 * Server configuration with environment-specific settings
 */
const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // API Keys
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  
  // Limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024), // 5MB default
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50 // requests per window
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: 5,
    maxSize: '5m'
  },
  
  // Log configurations at startup for debugging
  logConfig: function() {
    console.log('Starting server with configuration:');
    console.log('PORT:', this.port);
    console.log('NODE_ENV:', this.nodeEnv);
    console.log('CLIENT_URL:', this.clientUrl);
    console.log('STRIPE_SECRET_KEY:', this.stripeSecretKey ? 'Set' : 'Not set');
    console.log('OPENAI_API_KEY:', this.openaiApiKey ? 'Set' : 'Not set');
    console.log('MAX_FILE_SIZE:', `${this.maxFileSize} bytes (${this.maxFileSize / (1024 * 1024)} MB)`);
    
    if (this.nodeEnv === 'production') {
      console.log('CORS_ORIGIN:', this.cors.origin);
      console.log('RATE_LIMIT:', `${this.rateLimit.max} requests per ${this.rateLimit.windowMs/1000}s`);
    }
  }
};

// Override with production settings if in production
if (process.env.NODE_ENV === 'production') {
  Object.assign(config, productionConfig);
}

module.exports = config; 