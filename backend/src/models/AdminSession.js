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

// In-Memory & Supabase Session Store
const activeSessions = new Map();

AdminSession.create = async function(doc) {
  activeSessions.set(doc.sessionId, doc);
  const db = require('../config/supabase');
  if (db && db.supabase) {
    try {
      await db.supabase.from('admin_sessions').insert([{
        session_id: doc.sessionId,
        admin_id: doc.adminId && String(doc.adminId).includes('-') ? doc.adminId : null,
        username: doc.username,
        csrf_token: doc.csrfToken,
        user_agent: doc.userAgent || '',
        ip_address: doc.ipAddress || '',
        expires_at: doc.expiresAt ? doc.expiresAt.toISOString() : new Date(Date.now() + 8*3600*1000).toISOString()
      }]);
    } catch (e) {}
  }
  return doc;
};

AdminSession.findOne = async function(query) {
  const sessionId = query ? query.sessionId : null;
  if (!sessionId) return null;

  // 1. Check in-memory session cache
  const mem = activeSessions.get(sessionId);
  if (mem) {
    if (new Date(mem.expiresAt) > new Date()) return mem;
    activeSessions.delete(sessionId);
    return null;
  }

  // 2. Check Supabase admin_sessions table
  const db = require('../config/supabase');
  if (db && db.supabase) {
    try {
      const { data, error } = await db.supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!error && data && new Date(data.expires_at) > new Date()) {
        const sess = {
          sessionId: data.session_id,
          adminId: data.admin_id || 'admin-001',
          username: data.username,
          csrfToken: data.csrf_token,
          expiresAt: new Date(data.expires_at)
        };
        activeSessions.set(sessionId, sess);
        return sess;
      }
    } catch (e) {}
  }

  return null;
};

AdminSession.deleteOne = async function(query) {
  if (query && query.sessionId) {
    activeSessions.delete(query.sessionId);
    const db = require('../config/supabase');
    if (db && db.supabase) {
      try {
        await db.supabase.from('admin_sessions').delete().eq('session_id', query.sessionId);
      } catch (e) {}
    }
  }
  return { deletedCount: 1 };
};

AdminSession.invalidateSession = async function(sessionId) {
  return this.deleteOne({ sessionId });
};

module.exports = AdminSession;
