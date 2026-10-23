const mongoose = require('mongoose');
const crypto = require('crypto');
const { ALL_KNOWN_GAME_IDS } = require('../config/gamesCatalogue');

/**
 * Team Member Subschema
 */
const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team member name is required'],
    trim: true,
    minlength: [2, 'Member name must be at least 2 characters'],
    maxlength: [100, 'Member name cannot exceed 100 characters']
  },
  roll: {
    type: String,
    trim: true,
    maxlength: [50, 'Member roll number cannot exceed 50 characters'],
    default: ''
  },
  contact: {
    type: String,
    trim: true,
    maxlength: [20, 'Member contact number cannot exceed 20 characters'],
    default: ''
  }
}, { _id: false });

/**
 * Selected Game Subschema
 */
const selectedGameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: [true, 'Game ID is required'],
    enum: {
      values: ALL_KNOWN_GAME_IDS,
      message: 'Invalid game ID: {VALUE}'
    }
  },
  gameName: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    maxlength: [100, 'Game name cannot exceed 100 characters']
  },
  participationType: {
    type: String,
    required: [true, 'Participation type is required'],
    enum: {
      values: ['individual', 'team'],
      message: 'Participation type must be individual or team'
    }
  },
  teamName: {
    type: String,
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters'],
    default: ''
  },
  teamMembers: {
    type: [teamMemberSchema],
    default: [],
    validate: {
      validator: function(val) {
        return val.length <= 15; // Sensible payload guardrail
      },
      message: 'Team members list exceeds maximum allowed limit'
    }
  }
}, { _id: false });

/**
 * Student Information Subschema
 */
const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Student full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    minlength: [10, 'Mobile number must be at least 10 digits'],
    maxlength: [16, 'Mobile number cannot exceed 16 characters']
  },
  rollNumber: {
    type: String,
    required: [true, 'University roll number is required'],
    trim: true,
    minlength: [1, 'Roll number cannot be empty'],
    maxlength: [50, 'Roll number cannot exceed 50 characters']
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true,
    maxlength: [100, 'Course cannot exceed 100 characters']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true,
    maxlength: [100, 'Branch cannot exceed 100 characters']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
    maxlength: [50, 'Academic year cannot exceed 50 characters']
  }
}, { _id: false });

/**
 * Main Registration Schema
 */
const registrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  idempotencyKey: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
    maxlength: [128, 'Idempotency key too long']
  },
  student: {
    type: studentSchema,
    required: true
  },
  selectedGames: {
    type: [selectedGameSchema],
    required: [true, 'At least one game must be selected'],
    validate: {
      validator: function(games) {
        return Array.isArray(games) && games.length > 0 && games.length <= 6;
      },
      message: 'You must select between 1 and 6 games'
    }
  },
  feePerGame: {
    type: Number,
    default: 5
  },
  feeAmount: {
    type: Number,
    required: true,
    default: function() {
      return (Array.isArray(this.selectedGames) && this.selectedGames.length > 0)
        ? this.selectedGames.length * 5
        : 0;
    }
  },
  feeCurrency: {
    type: String,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'pending_desk_collection', 'payment_pending', 'payment_verification_pending', 'paid', 'payment_failed', 'waived'],
    default: 'payment_pending',
    index: true
  },
  paymentReference: {
    type: String,
    trim: true,
    maxlength: [100, 'Payment reference cannot exceed 100 characters'],
    default: null
  },
  paymentVerifiedAt: {
    type: Date,
    default: null
  },
  paymentVerifiedBy: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    default: 'confirmed',
    enum: ['confirmed', 'cancelled', 'pending'],
    index: true
  },
  participationStatus: {
    type: String,
    default: 'unverified',
    enum: ['unverified', 'verified', 'absent'],
    index: true
  },
  participationVerifiedAt: {
    type: Date,
    default: null
  },
  participationVerifiedBy: {
    type: String,
    trim: true,
    default: null
  },
  certificateIssued: {
    type: Boolean,
    default: false,
    index: true
  },
  certificateId: {
    type: String,
    trim: true,
    uppercase: true,
    default: null
  },
  clientIp: {
    type: String,
    trim: true,
    maxlength: 45
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Generates a unique, collision-resistant Registration ID (e.g. SRMU-2026-X8K9M2)
 */
registrationSchema.statics.generateRegistrationId = function() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 avoiding ambiguous 0, O, 1, I
  let randomPart = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    randomPart += chars[randomBytes[i] % chars.length];
  }
  return `SRMU-2026-${randomPart}`;
};

/**
 * Creates and saves a registration document with collision handling
 */
registrationSchema.statics.createWithCollisionHandling = async function(data, maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;
    try {
      const doc = new this({
        ...data,
        registrationId: this.generateRegistrationId()
      });
      return await doc.save();
    } catch (err) {
      // Check for duplicate key error on registrationId specifically (code 11000)
      if (err.code === 11000 && err.keyPattern && err.keyPattern.registrationId) {
        if (attempts >= maxRetries) {
          throw new Error('Failed to generate unique registration ID after multiple attempts');
        }
        continue;
      }
      throw err;
    }
  }
};

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
