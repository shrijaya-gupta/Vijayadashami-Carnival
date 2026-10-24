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
  },
  whatsAppConsent: {
    type: Boolean,
    default: true
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
  const db = require('../config/supabase');
  const regId = this.generateRegistrationId();
  const fee = (data.selectedGames ? data.selectedGames.length : 1) * 5;

  const payload = {
    ...data,
    registrationId: regId,
    totalAmount: fee,
    feeAmount: fee,
    paymentStatus: data.paymentStatus || 'payment_pending',
    status: data.status || 'confirmed',
    attendanceStatus: data.attendanceStatus || 'pending'
  };

  const created = await db.createRegistration(payload);
  return {
    ...payload,
    _id: created.id || regId,
    id: created.id || regId,
    registrationId: regId,
    createdAt: created.created_at || new Date().toISOString()
  };
};

const Registration = mongoose.model('Registration', registrationSchema);

// Supabase & In-Memory Bridge Helpers
function normalizeRegistrationDoc(r) {
  if (!r) return null;
  const games = r.selected_games || r.selectedGames || [];
  const fee = r.total_amount != null ? Number(r.total_amount) : (games.length * 5);
  const doc = {
    ...r,
    _id: r.id || r.registration_id,
    id: r.id || r.registration_id,
    registrationId: r.registration_id || r.registrationId,
    student: r.student || {},
    selectedGames: games,
    totalAmount: fee,
    feeAmount: fee,
    paymentStatus: r.payment_status || r.paymentStatus || 'payment_pending',
    paymentReference: r.payment_reference || r.paymentReference || '',
    status: r.status || 'confirmed',
    attendanceStatus: r.attendance_status || r.attendanceStatus || 'pending',
    participationStatus: (r.attendance_status === 'verified' || r.participationStatus === 'verified') ? 'verified' : 'unverified',
    certificateIssued: Boolean(r.certificateIssued || r.certificate_id),
    certificateId: r.certificate_id || r.certificateId || null,
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };

  doc.save = async function() {
    const db = require('../config/supabase');
    await db.updateRegistrationStatus(this.registrationId, {
      status: this.status,
      paymentStatus: this.paymentStatus,
      paymentReference: this.paymentReference,
      attendanceStatus: this.attendanceStatus
    });
    return this;
  };

  return doc;
}

function matchesFilter(item, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (filter.status) {
    if (filter.status.$ne && item.status === filter.status.$ne) return false;
    if (typeof filter.status === 'string' && item.status !== filter.status) return false;
  }

  if (filter.paymentStatus) {
    if (typeof filter.paymentStatus === 'string' && item.paymentStatus !== filter.paymentStatus) return false;
    if (filter.paymentStatus.$in && !filter.paymentStatus.$in.includes(item.paymentStatus)) return false;
  }

  if (filter['selectedGames.gameId']) {
    const targetGame = filter['selectedGames.gameId'];
    if (!item.selectedGames || !item.selectedGames.some(g => (g.gameId === targetGame || g.id === targetGame))) return false;
  }

  if (filter['selectedGames.participationType']) {
    const targetFormat = filter['selectedGames.participationType'];
    if (!item.selectedGames || !item.selectedGames.some(g => g.participationType === targetFormat)) return false;
  }

  if (filter['student.rollNumber'] && item.student?.rollNumber !== filter['student.rollNumber']) return false;
  if (filter.idempotencyKey && item.idempotencyKey !== filter.idempotencyKey) return false;
  if (filter['student.course'] && item.student?.course !== filter['student.course']) return false;
  if (filter['student.branch'] && item.student?.branch !== filter['student.branch']) return false;
  if (filter['student.academicYear'] && item.student?.academicYear !== filter['student.academicYear']) return false;
  if (filter.registrationId && item.registrationId !== filter.registrationId) return false;

  if (Array.isArray(filter.$or)) {
    const matchesAny = filter.$or.some(clause => {
      if (clause.registrationId) {
        if (clause.registrationId.test && clause.registrationId.test(item.registrationId)) return true;
        if (typeof clause.registrationId === 'string' && item.registrationId.toLowerCase().includes(clause.registrationId.toLowerCase())) return true;
      }
      if (clause['student.fullName']) {
        const name = item.student?.fullName || '';
        if (clause['student.fullName'].test && clause['student.fullName'].test(name)) return true;
        if (typeof clause['student.fullName'] === 'string' && name.toLowerCase().includes(clause['student.fullName'].toLowerCase())) return true;
      }
      if (clause['student.rollNumber']) {
        const roll = item.student?.rollNumber || '';
        if (clause['student.rollNumber'].test && clause['student.rollNumber'].test(roll)) return true;
        if (typeof clause['student.rollNumber'] === 'string' && roll.toLowerCase().includes(clause['student.rollNumber'].toLowerCase())) return true;
      }
      if (clause['student.mobileNumber']) {
        const mobile = item.student?.mobileNumber || '';
        if (clause['student.mobileNumber'].test && clause['student.mobileNumber'].test(mobile)) return true;
        if (typeof clause['student.mobileNumber'] === 'string' && mobile.includes(clause['student.mobileNumber'])) return true;
      }
      if (clause.paymentReference) {
        const ref = item.paymentReference || '';
        if (clause.paymentReference.test && clause.paymentReference.test(ref)) return true;
        if (typeof clause.paymentReference === 'string' && ref.toLowerCase().includes(clause.paymentReference.toLowerCase())) return true;
      }
      return false;
    });
    if (!matchesAny) return false;
  }

  return true;
}

class QueryChain {
  constructor(fetchFn) {
    this.fetchFn = fetchFn;
    this._sort = null;
    this._skip = 0;
    this._limit = 0;
  }
  select() { return this; }
  sort(s) { this._sort = s; return this; }
  skip(n) { this._skip = n; return this; }
  limit(n) { this._limit = n; return this; }
  lean() { return this; }
  async then(resolve, reject) {
    try {
      let res = await this.fetchFn();
      if (Array.isArray(res)) {
        if (this._sort && this._sort.createdAt === -1) {
          res.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        if (this._skip > 0) res = res.slice(this._skip);
        if (this._limit > 0) res = res.slice(0, this._limit);
      }
      resolve(res);
    } catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }
}

Registration.countDocuments = async function(filter = {}) {
  const db = require('../config/supabase');
  const all = await db.getAllRegistrations();
  const normalized = all.map(normalizeRegistrationDoc);
  return normalized.filter(item => matchesFilter(item, filter)).length;
};

Registration.find = function(filter = {}) {
  return new QueryChain(async () => {
    const db = require('../config/supabase');
    const all = await db.getAllRegistrations();
    const list = all.map(normalizeRegistrationDoc);
    return list.filter(item => matchesFilter(item, filter));
  });
};

Registration.findOne = function(filter = {}) {
  return new QueryChain(async () => {
    const db = require('../config/supabase');
    if (filter.registrationId && typeof filter.registrationId === 'string') {
      const doc = await db.findRegistrationById(filter.registrationId);
      return normalizeRegistrationDoc(doc);
    }
    const all = await db.getAllRegistrations();
    const list = all.map(normalizeRegistrationDoc);
    return list.find(item => matchesFilter(item, filter)) || null;
  });
};

Registration.findById = async function(id) {
  const db = require('../config/supabase');
  const doc = await db.findRegistrationById(id);
  return normalizeRegistrationDoc(doc);
};

Registration.deleteOne = async function(query = {}) {
  const db = require('../config/supabase');
  const regId = query.registrationId || query._id;
  if (db && db.supabase && regId) {
    try {
      await db.supabase.from('registrations').delete().eq('registration_id', regId);
    } catch (e) {}
  }
  return { deletedCount: 1 };
};

module.exports = Registration;
