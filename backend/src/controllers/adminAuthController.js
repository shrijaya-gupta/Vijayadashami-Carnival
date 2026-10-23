const crypto = require('crypto');
const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * POST /api/admin/login
 * Authenticates administrator and sets secure HttpOnly session cookie
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    // Validate inputs
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Look up administrator
    const user = await AdminUser.findOne({ username: cleanUsername });
    if (!user) {
      // Generic error: do not reveal whether username exists
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate cryptographically secure tokens
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    // Save server session in MongoDB
    await AdminSession.create({
      sessionId,
      adminId: user._id,
      username: user.username,
      csrfToken,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.socket?.remoteAddress || '',
      expiresAt
    });

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const isProd = process.env.NODE_ENV === 'production';

    // 1. Set HttpOnly session cookie
    res.cookie('srmu_admin_session', sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS
    });

    // 2. Set CSRF token cookie readable by client JavaScript for X-CSRF-Token header
    res.cookie('srmu_csrf', csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      admin: {
        username: user.username,
        fullName: user.fullName,
        role: user.role
      },
      csrfToken
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/logout
 * Destroys session in MongoDB and clears cookies
 */
async function logout(req, res, next) {
  try {
    if (req.adminSession) {
      await AdminSession.invalidateSession(req.adminSession.sessionId);
    }

    res.clearCookie('srmu_admin_session', { path: '/' });
    res.clearCookie('srmu_csrf', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/me
 * Checks active session and returns authenticated admin profile
 */
async function getMe(req, res, next) {
  try {
    const user = await AdminUser.findById(req.admin.id).select('username fullName role lastLogin createdAt');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Admin user record no longer exists'
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      admin: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin
      },
      csrfToken: req.adminSession.csrfToken
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  logout,
  getMe
};
