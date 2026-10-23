const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * GET /api/health
 * Returns server and database health status without leaking internal details
 */
router.get('/', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isDbHealthy = readyState === 1;

  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? 'healthy' : 'degraded',
    service: 'Vijayadashami Carnival Registration API',
    database: dbStatusMap[readyState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
