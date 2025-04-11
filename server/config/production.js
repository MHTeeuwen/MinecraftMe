/**
 * Production configuration
 */
const config = {
  // Server settings
  port: process.env.PORT || 3001,
  nodeEnv: 'production',
  
  // Security
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per windowMs per IP
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
      });
    }
  },
  
  // File upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
  },
  
  // Logging
  logging: {
    level: 'info',
    maxFiles: 5,
    maxSize: '10m',
    // Don't log sensitive information
    format: (info) => {
      const { level, message, timestamp, ...meta } = info;
      // Remove sensitive data from logs
      if (meta.headers) {
        delete meta.headers.authorization;
        delete meta.headers.cookie;
      }
      return { level, message, timestamp, ...meta };
    }
  },

  // Error handling
  errors: {
    // Don't send stack traces in production
    includeStack: false,
    // Generic error messages for sensitive errors
    messages: {
      database: 'Database operation failed',
      authentication: 'Authentication failed',
      validation: 'Invalid input provided',
      payment: 'Payment processing failed',
      server: 'Internal server error'
    }
  }
};

module.exports = config; 