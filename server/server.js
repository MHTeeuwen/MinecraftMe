// Load and validate environment variables
require('dotenv').config();
require('./utils/validateEnv')();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./utils/errors');
const convertRouter = require('./routes/convert');
const stripeRouter = require('./routes/stripe');
const config = require('./config');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/logging');

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const app = express();

// Debug logging
config.logConfig();
logger.info('Server starting');

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res) => {
    logger.warn('Rate limit reached', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      headers: req.headers,
      rateLimit: {
        max: 30,
        windowMs: 15 * 60 * 1000
      }
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again after 15 minutes'
    });
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(limiter);
app.use(requestLogger);

// Routes
app.use('/api/convert', convertRouter);
app.use('/api/stripe', stripeRouter);

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'MinecraftMe API Server',
    version: '1.0.0',
    endpoints: [
      '/api/convert',
      '/api/stripe/create-checkout-session',
      '/api/stripe/session/:sessionId',
      '/api/test'
    ]
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Check if port is in use before starting
const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

// Start server with port checking
const startServer = async () => {
  const port = config.port;
  
  try {
    const portAvailable = await checkPort(port);
    if (!portAvailable) {
      logger.warn(`Port ${port} is in use, trying ${port + 1}`);
      config.port = port + 1;
    }
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Available routes:');
        console.log('- POST /api/convert');
        console.log('- POST /api/stripe/create-checkout-session');
        console.log('- GET /api/stripe/session/:sessionId');
        console.log('- GET /api/test');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;