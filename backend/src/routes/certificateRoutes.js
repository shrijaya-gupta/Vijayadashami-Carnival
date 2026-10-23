const express = require('express');
const {
  verifyCertificatePublic,
  downloadCertificatePublic,
  checkStudentCertificateStatus
} = require('../controllers/publicCertificateController');
const { certificateLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// GET /api/certificates/verify/:token — Public certificate authenticity verification
router.get('/verify/:token', certificateLimiter, verifyCertificatePublic);

// GET /api/certificates/download/:token — Public PDF download
router.get('/download/:token', certificateLimiter, downloadCertificatePublic);

// GET /api/certificates/student/:registrationId — Student certificate readiness lookup
router.get('/student/:registrationId', certificateLimiter, checkStudentCertificateStatus);

module.exports = router;
