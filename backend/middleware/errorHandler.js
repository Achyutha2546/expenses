// backend/middleware/errorHandler.js
const logger = require('../utils/logger'); // optional lightweight logger

// Centralized error handling middleware
function errorHandler(err, req, res, next) {
  // Log the error details for debugging
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user ? req.user.uid : undefined,
  });

  // Determine status code
  const status = err.statusCode || 500;

  // Prepare user‑friendly error response
  const response = {
    error: {
      code: err.code || (status === 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR'),
      message: err.userMessage || 'Something went wrong. Please try again later.',
    },
  };

  // For validation errors, expose details safely
  if (err.validation) {
    response.error.code = 'VALIDATION_ERROR';
    response.error.message = err.userMessage || 'Invalid input. Please check your data.';
    response.error.details = err.validation;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
