const AdminSession = require('../models/AdminSession');

/**
 * Authentication Middleware: Verifies active server-managed admin session
 */
async function requireAdminAuth(req, res, next) {
  try {
    // Check HttpOnly cookie first, then fall back to Authorization Bearer header
    let sessionId = req.cookies ? req.cookies.srmu_admin_session : null;

    if (!sessionId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      sessionId = req.headers.authorization.split(' ')[1].trim();
    }

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to access organizer resources.'
      });
    }

    // Verify session in MongoDB
    const session = await AdminSession.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      // Clear invalid/expired cookie if present
      if (req.cookies && req.cookies.srmu_admin_session) {
        res.clearCookie('srmu_admin_session', { path: '/' });
      }
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid. Please log in again.'
      });
    }

    // Attach verified admin identity to request object
    req.admin = {
      id: session.adminId,
      username: session.username
    };
    req.adminSession = session;

    next();
  } catch (err) {
    console.error('[AUTH ERROR] Exception in requireAdminAuth:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error'
    });
  }
}

/**
 * CSRF Protection Middleware for state-changing HTTP verbs
 */
function verifyCsrf(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt login from CSRF check because session does not exist prior to login
  if (req.originalUrl && req.originalUrl.endsWith('/login')) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'] || (req.body && req.body._csrf) || (req.cookies && req.cookies.srmu_csrf);
  const sessionToken = req.adminSession ? req.adminSession.csrfToken : null;

  if (!clientToken || !sessionToken || clientToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF token. Action rejected for security.'
    });
  }

  next();
}

module.exports = {
  requireAdminAuth,
  verifyCsrf
};
