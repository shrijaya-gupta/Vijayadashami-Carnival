/**
 * Central Error Handler Middleware
 * Catches all thrown/passed errors and formats safe JSON responses
 * without leaking server stack traces or database internals.
 */
function errorHandler(err, req, res, next) {
  // Malformed JSON payload syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload received.'
    });
  }

  // Request entity too large (body-parser limit)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload size exceeds the allowable limit (50KB).'
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Conflict: A registration with this unique identifier or key already exists.'
    });
  }

  // Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid parameter format provided.'
    });
  }

  // General internal error
  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'An unexpected internal server error occurred. Please try again.' : err.message,
    ...(isDev && statusCode >= 500 ? { devMessage: err.message } : {})
  });
}

module.exports = errorHandler;
