const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Admin User Schema for Vijayadashami Carnival Organizers
 */
const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    index: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  fullName: {
    type: String,
    trim: true,
    default: 'Event Organizer',
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'organizer'],
    default: 'admin'
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Compare candidate password with stored hash
 */
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Helper to hash a plain-text password
 */
adminUserSchema.statics.hashPassword = async function(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Bootstrap helper to ensure an initial administrator account exists
 * Configured securely through environment variables (ADMIN_USERNAME & ADMIN_PASSWORD)
 */
adminUserSchema.statics.ensureInitialAdmin = async function() {
  const existingCount = await this.countDocuments();
  if (existingCount > 0) {
    return null; // Admin already exists
  }

  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.warn('[ADMIN SECURITY NOTICE] No ADMIN_PASSWORD specified in .env. Initial administrator was not automatically created. Use "node src/scripts/bootstrapAdmin.js <user> <pass>" to create one.');
    return null;
  }

  const passwordHash = await this.hashPassword(password);
  const initialAdmin = await this.create({
    username,
    passwordHash,
    fullName: 'SRMU Event Lead Organizer',
    role: 'admin'
  });

  console.log(`[ADMIN BOOTSTRAP] Initial administrator account created for username: '${username}'`);
  return initialAdmin;
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;
