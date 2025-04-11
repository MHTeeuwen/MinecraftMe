const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    
    // Add metadata if available
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'minecraft-me' },
  transports: [
    // Console transport for all logs
    new winston.transports.Console(),
    
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for error logs only
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add tracking methods for common operations
logger.trackAPI = (req, res, responseTime) => {
  const { method, path, ip } = req;
  logger.info(`API ${method} ${path}`, {
    ip,
    status: res.statusCode,
    responseTime: `${responseTime}ms`
  });
};

logger.trackConversion = (status, processingTime, imageSize) => {
  logger.info(`Image conversion ${status}`, {
    processingTime: `${processingTime}ms`, 
    imageSize
  });
};

logger.trackPayment = (sessionId, plan, status) => {
  logger.info(`Payment ${status}`, { 
    sessionId, 
    plan
  });
};

module.exports = logger; 