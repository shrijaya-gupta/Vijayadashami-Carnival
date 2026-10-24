/**
 * Vercel Serverless Function entry point for Vijayadashami Carnival API
 * Proxies requests directly to the Express app powered by Supabase.
 */

const app = require('../backend/src/app');

module.exports = (req, res) => {
  return app(req, res);
};
