const express = require('express');
const rateLimit = require('express-rate-limit');
const { createRegistration, getRegistrationById, submitPaymentReference } = require('../controllers/registrationController');

const router = express.Router();

/**
 * Rate limiter for registration creation (prevents brute-force or spam submissions)
 * In test environment, rate limiting is relaxed.
 */
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 500 : 25, // max 25 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration requests from this connection. Please wait 15 minutes before trying again.'
  }
});

// POST /api/registrations - Register a student
router.post('/', registrationLimiter, createRegistration);

// POST & PATCH /api/registrations/:registrationId/payment-reference - Submit payment UTR/reference
router.post('/:registrationId/payment-reference', submitPaymentReference);
router.patch('/:registrationId/payment', submitPaymentReference);
router.post('/:registrationId/payment', submitPaymentReference);

// GET /api/registrations/:registrationId - Retrieve safe confirmation details
router.get('/:registrationId', getRegistrationById);

module.exports = router;
