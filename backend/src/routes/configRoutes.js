const express = require('express');
const EVENT_CONFIG = require('../config/eventConfig');
const db = require('../config/supabase');

const router = express.Router();

// Middleware to ensure real-time fresh responses with no client/proxy caching
router.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

/**
 * GET /api/config
 * Returns public authoritative event configuration
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: EVENT_CONFIG
  });
});

/**
 * GET /api/config/payment-qr
 * Returns payment QR code image URL and UPI details from Supabase
 */
router.get('/payment-qr', async (req, res) => {
  try {
    const config = await db.getEventConfig();
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: {
        upi_id: 'srmu.carnival@upi',
        upi_name: 'SRMU B5-408 Carnival Desk',
        qr_image_url: '',
        is_qr_active: false
      }
    });
  }
});

/**
 * POST /api/config/payment-qr
 * Updates payment QR code image URL and UPI details (Admin action)
 */
router.post('/payment-qr', async (req, res) => {
  try {
    const { upi_id, upi_name, qr_image_url, is_qr_active } = req.body || {};
    const updated = await db.updateEventConfig({
      upi_id: upi_id ? String(upi_id).trim() : 'srmu.carnival@upi',
      upi_name: upi_name ? String(upi_name).trim() : 'SRMU B5-408 Carnival Desk',
      qr_image_url: qr_image_url ? String(qr_image_url).trim() : '',
      is_qr_active: is_qr_active !== undefined ? Boolean(is_qr_active) : true
    });

    res.status(200).json({
      success: true,
      message: 'Payment QR configuration updated successfully!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update payment QR configuration: ' + err.message
    });
  }
});

/**
 * GET /api/config/scoreboard
 * Returns live campus game scores and rankings
 */
router.get('/scoreboard', async (req, res) => {
  try {
    const gameId = req.query.gameId;
    const scores = await db.getGameScores(gameId);
    res.status(200).json({
      success: true,
      data: scores
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoreboard: ' + err.message
    });
  }
});

module.exports = router;
