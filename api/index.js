/**
 * Vercel Serverless Function entry point for Vijayadashami Carnival API
 * Proxies requests to the existing Express app and manages database connectivity.
 */

const path = require('path');
const app = require('../backend/src/app');

// Resolve mongoose instance from root or backend node_modules
let mongoose;
try {
  mongoose = require('mongoose');
} catch {
  mongoose = require('../backend/node_modules/mongoose');
}

let connectDB;
try {
  ({ connectDB } = require('../backend/src/config/db'));
} catch (e) {
  console.warn('connectDB loader warning:', e.message);
}

// Cached connection state across warm lambda invocations
let isConnecting = null;

module.exports = async (req, res) => {
  // Connect to MongoDB if configured and not already connected
  if (process.env.MONGODB_URI && mongoose && mongoose.connection.readyState === 0 && connectDB) {
    try {
      if (!isConnecting) {
        isConnecting = connectDB().finally(() => {
          isConnecting = null;
        });
      }
      await isConnecting;
    } catch (err) {
      console.error('Serverless MongoDB auto-connect error:', err.message);
    }
  }

  // Forward request to Express application
  return app(req, res);
};
