/**
 * Vercel Serverless Function entry point when Root Directory is set to 'backend'
 * Proxies requests directly to Express app powered by Supabase.
 */

const app = require('../src/app');

module.exports = (req, res) => {
  return app(req, res);
};
