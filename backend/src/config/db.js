const mongoose = require('mongoose');

/**
 * Sanitizes MongoDB URI for safe logging without credentials
 */
function sanitizeMongoUri(uri) {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return 'mongodb://[credentials-hidden]';
  }
}

/**
 * Connects to MongoDB with validation and event listeners
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('FATAL: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error (${sanitizeMongoUri(uri)}):`, error.message);
    throw error;
  }
}

/**
 * Closes the database connection cleanly (for graceful shutdown / tests)
 */
async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  sanitizeMongoUri
};
