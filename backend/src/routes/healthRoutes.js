const express = require('express');
const db = require('../config/supabase');

const router = express.Router();

/**
 * GET /api/health
 * Returns server and database health status without leaking internal details
 */
router.get('/', (req, res) => {
  const isSupabase = db.isSupabaseConfigured && Boolean(db.supabase);
  const isHealthy = isSupabase || (db.memoryStore && Array.isArray(db.memoryStore.registrations));

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Vijayadashami Carnival Registration API',
    database: isSupabase ? 'connected (Supabase Cloud)' : 'connected (In-Memory Hot Store)',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
