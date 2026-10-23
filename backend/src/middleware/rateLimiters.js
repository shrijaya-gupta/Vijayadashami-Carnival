const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for admin login endpoint to prevent brute-force attacks
 */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait 15 minutes before trying again.'
  }
});

/**
 * Rate limiter for CSV data exports
 */
const adminExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many export requests. Please wait a few minutes before exporting again.'
  }
});

/**
 * Rate limiter for certificate verification and download endpoints
 */
const certificateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120, // 120 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many certificate verification or download requests. Please try again shortly.'
  }
});

module.exports = {
  adminLoginLimiter,
  adminExportLimiter,
  certificateLimiter
};
