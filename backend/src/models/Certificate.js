const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Certificate Schema
 * Stores verified participation certificates with collision-resistant unique IDs
 * and cryptographically unpredictable public verification tokens.
 */
const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  registrationId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    default: 'vijayadashami-carnival-2026',
    trim: true,
    index: true
  },
  participantName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  eventName: {
    type: String,
    required: true,
    default: 'Vijayadashami Carnival',
    trim: true
  },
  eventDate: {
    type: String,
    required: true,
    default: 'Thursday, 29 October 2026',
    trim: true
  },
  eventVenue: {
    type: String,
    required: true,
    default: 'SRMU Campus, B5-408',
    trim: true
  },
  gamesParticipated: {
    type: [String],
    default: []
  },
  certificateType: {
    type: String,
    required: true,
    default: 'participation',
    enum: ['participation']
  },
  status: {
    type: String,
    required: true,
    default: 'valid',
    enum: ['valid', 'revoked'],
    index: true
  },
  issuedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  issuedBy: {
    type: String,
    required: true,
    trim: true
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedBy: {
    type: String,
    trim: true,
    default: null
  },
  revocationReason: {
    type: String,
    trim: true,
    default: null
  },
  verificationToken: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Enforce unique certificate per registration and event
certificateSchema.index({ registrationId: 1, eventId: 1 }, { unique: true });

/**
 * Generates a unique collision-resistant Certificate ID (e.g. SRMU-CERT-2026-X8K9M2)
 */
certificateSchema.statics.generateCertificateId = function() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    randomPart += chars[randomBytes[i] % chars.length];
  }
  return `SRMU-CERT-2026-${randomPart}`;
};

/**
 * Generates a cryptographically secure, unpredictable verification token
 */
certificateSchema.statics.generateVerificationToken = function() {
  return crypto.randomBytes(24).toString('hex'); // 48-char hex string
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
