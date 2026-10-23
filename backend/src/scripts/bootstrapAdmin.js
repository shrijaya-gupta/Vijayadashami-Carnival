#!/usr/bin/env node
/**
 * Admin Account Bootstrap Script
 * Usage: node src/scripts/bootstrapAdmin.js <username> <password> [fullName]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

async function bootstrap() {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.ADMIN_USERNAME || 'admin';
  const password = args[1] || process.env.ADMIN_PASSWORD;
  const fullName = args[2] || 'SRMU Event Lead Organizer';

  if (!password) {
    console.error('Error: Password is required.');
    console.error('Usage: node src/scripts/bootstrapAdmin.js <username> <password> [fullName]');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srmu_fun_games';
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  const cleanUser = username.trim().toLowerCase();
  let user = await AdminUser.findOne({ username: cleanUser });

  const passwordHash = await AdminUser.hashPassword(password);

  if (user) {
    user.passwordHash = passwordHash;
    user.fullName = fullName;
    await user.save();
    console.log(`[SUCCESS] Admin user '${cleanUser}' password successfully updated.`);
  } else {
    user = await AdminUser.create({
      username: cleanUser,
      passwordHash,
      fullName,
      role: 'admin'
    });
    console.log(`[SUCCESS] Admin user '${cleanUser}' created successfully.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('[ERROR] Admin bootstrap failed:', err.message);
  process.exit(1);
});
