const mongoose = require('mongoose');

/**
 * Admin Session Schema for Server-Managed State
 * Sessions automatically expire via MongoDB TTL index.
 */
const adminSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  csrfToken: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index automatically removes expired sessions
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Clean up invalid or expired sessions for a specific user or session ID
 */
adminSessionSchema.statics.invalidateSession = async function(sessionId) {
  if (!sessionId) return;
  return this.deleteOne({ sessionId });
};

const AdminSession = mongoose.model('AdminSession', adminSessionSchema);

module.exports = AdminSession;
