/**
 * Vercel Serverless Function entry point when Root Directory is set to 'backend'
 */

const app = require('../src/app');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');

let isConnecting = null;

module.exports = async (req, res) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState === 0) {
    try {
      if (!isConnecting) {
        isConnecting = connectDB().finally(() => {
          isConnecting = null;
        });
      }
      await isConnecting;
    } catch (err) {
      console.error('MongoDB serverless auto-connect error:', err.message);
    }
  }

  return app(req, res);
};
