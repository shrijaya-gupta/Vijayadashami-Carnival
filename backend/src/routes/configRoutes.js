const express = require('express');
const EVENT_CONFIG = require('../config/eventConfig');

const router = express.Router();

/**
 * GET /api/config
 * Returns public authoritative event configuration, fee policy, deadline,
 * WhatsApp group details, and payment options.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: EVENT_CONFIG
  });
});

module.exports = router;
