const logger = require('./logger');

/**
 * Creates a custom error with status code
 */
function createError(message, statusCode = 500) {
  const error = new Error(message);
  // Handle case where statusCode might be an object (e.g., { statusCode: 400 })
  error.status = typeof statusCode === 'object' ? statusCode.statusCode || 500 : statusCode;
  return error;
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const timing = err.timing || undefined;

  // Log error based on severity
  if (statusCode >= 500) {
    logger.error(`Server Error: ${message}`, {
      path: req.path,
      method: req.method,
      stack: err.stack,
      statusCode
    });
  } else {
    logger.warn(`Client Error: ${message}`, {
      path: req.path,
      method: req.method,
      statusCode
    });
  }

  res.status(statusCode).json({
    error: message,
    code: statusCode,
    ...(timing && { timing }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  createError,
  errorHandler
};