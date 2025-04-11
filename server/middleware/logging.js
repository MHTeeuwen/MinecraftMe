const logger = require('../utils/logger');

/**
 * Middleware to log API requests and response times
 */
function requestLogger(req, res, next) {
  // Record request start time
  const start = Date.now();
  
  // Log request
  logger.info(`Request: ${req.method} ${req.path}`, {
    ip: req.ip,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
    }
  });
  
  // Capture response finish event
  res.on('finish', () => {
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Log response data
    logger.trackAPI(req, res, responseTime);
  });
  
  next();
}

module.exports = requestLogger; 