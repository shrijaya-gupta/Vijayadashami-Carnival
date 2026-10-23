const express = require('express');
const { login, logout, getMe } = require('../controllers/adminAuthController');
const {
  getDashboardStats,
  getRegistrationsList,
  getRegistrationDetails,
  updateRegistrationStatus,
  deleteRegistration,
  getGameParticipants,
  exportRegistrationsCsv
} = require('../controllers/adminDashboardController');
const {
  getParticipantsWithCertificateStatus,
  verifyParticipation,
  revokeParticipationVerification,
  issueCertificate,
  revokeCertificateEndpoint,
  adminDownloadCertificatePdf
} = require('../controllers/adminCertificateController');
const { requireAdminAuth, verifyCsrf } = require('../middleware/authMiddleware');
const { adminLoginLimiter, adminExportLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// ============================================================================
// 1. AUTHENTICATION ENDPOINTS
// ============================================================================

// POST /api/admin/login — Rate limited, sets HttpOnly session cookie
router.post('/login', adminLoginLimiter, login);

// POST /api/admin/logout — Requires auth & CSRF, destroys session
router.post('/logout', requireAdminAuth, verifyCsrf, logout);

// GET /api/admin/me — Checks active session
router.get('/me', requireAdminAuth, getMe);

// ============================================================================
// 2. DASHBOARD & REPORTING ENDPOINTS
// ============================================================================

// GET /api/admin/dashboard — Aggregates live database statistics
router.get('/dashboard', requireAdminAuth, getDashboardStats);

// GET /api/admin/registrations/export — Generates sanitized CSV (before :registrationId param route)
router.get('/registrations/export', requireAdminAuth, adminExportLimiter, exportRegistrationsCsv);

// GET /api/admin/registrations — Search, filter & paginate registrations
router.get('/registrations', requireAdminAuth, getRegistrationsList);

// GET /api/admin/registrations/:registrationId — Full registration details
router.get('/registrations/:registrationId', requireAdminAuth, getRegistrationDetails);

// PATCH /api/admin/registrations/:registrationId — Update status with CSRF protection
router.patch('/registrations/:registrationId', requireAdminAuth, verifyCsrf, updateRegistrationStatus);

// DELETE /api/admin/registrations/:registrationId — Remove test/duplicate registration with CSRF
router.delete('/registrations/:registrationId', requireAdminAuth, verifyCsrf, deleteRegistration);

// GET /api/admin/games/:gameId/registrations — Game-specific participants list
router.get('/games/:gameId/registrations', requireAdminAuth, getGameParticipants);

// ============================================================================
// 3. CERTIFICATE & ATTENDANCE MANAGEMENT ENDPOINTS (PHASE 7)
// ============================================================================

// GET /api/admin/certificates/participants — List participants with verification/certificate status
router.get('/certificates/participants', requireAdminAuth, getParticipantsWithCertificateStatus);

// POST /api/admin/certificates/verify-participation/:registrationId — Mark participation verified
router.post('/certificates/verify-participation/:registrationId', requireAdminAuth, verifyCsrf, verifyParticipation);

// POST /api/admin/certificates/revoke-verification/:registrationId — Revoke participation verification
router.post('/certificates/revoke-verification/:registrationId', requireAdminAuth, verifyCsrf, revokeParticipationVerification);

// POST /api/admin/certificates/issue/:registrationId — Issue participation certificate (only after verification)
router.post('/certificates/issue/:registrationId', requireAdminAuth, verifyCsrf, issueCertificate);

// POST /api/admin/certificates/:certificateId/revoke — Revoke issued certificate
router.post('/certificates/:certificateId/revoke', requireAdminAuth, verifyCsrf, revokeCertificateEndpoint);

// GET /api/admin/certificates/:certificateId/download — Admin certificate PDF download
router.get('/certificates/:certificateId/download', requireAdminAuth, adminDownloadCertificatePdf);

module.exports = router;

