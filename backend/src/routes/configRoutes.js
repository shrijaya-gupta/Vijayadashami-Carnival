const express = require('express');
const EVENT_CONFIG = require('../config/eventConfig');
const db = require('../config/supabase');
const { requireAdminAuth, verifyCsrf } = require('../middleware/authMiddleware');

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
        upi_id: 'guptashrijaya-1@oksbi',
        upi_name: 'Shrijaya Gupta (SRMU B5-408 Carnival Desk)',
        qr_image_url: '/assets/official-upi-qr.jpg',
        is_qr_active: true
      }
    });
  }
});

/**
 * POST /api/config/payment-qr
 * Updates payment QR code image URL and UPI details (Admin action)
 */
router.post('/payment-qr', requireAdminAuth, verifyCsrf, async (req, res) => {
  try {
    const { upi_id, upi_name, qr_image_url, is_qr_active } = req.body || {};
    const updated = await db.updateEventConfig({
      upi_id: upi_id ? String(upi_id).trim() : 'guptashrijaya-1@oksbi',
      upi_name: upi_name ? String(upi_name).trim() : 'Shrijaya Gupta (SRMU B5-408 Carnival Desk)',
      qr_image_url: qr_image_url ? String(qr_image_url).trim() : '/assets/official-upi-qr.jpg',
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
    const result = await db.getGameScores(gameId);
    res.status(200).json({
      success: true,
      data: result.scores,
      participantCounts: result.participantCounts,
      totalRegistered: result.totalRegisteredStudents
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoreboard: ' + err.message
    });
  }
});

/**
 * POST /api/config/scoreboard
 * Records or updates a verified carnival heat score
 */
router.post('/scoreboard', requireAdminAuth, verifyCsrf, async (req, res) => {
  try {
    const { game_id, game_name, participant_name, score, rank, category, roll_number } = req.body || {};
    if (!game_id || !participant_name || !score) {
      return res.status(400).json({
        success: false,
        error: 'Missing required score fields: game_id, participant_name, and score are mandatory.'
      });
    }

    const created = await db.addGameScore({
      game_id,
      game_name: game_name || game_id,
      participant_name,
      score,
      rank: rank ? parseInt(rank, 10) : 1,
      category: category || 'Solo',
      roll_number: roll_number || ''
    });

    res.status(201).json({
      success: true,
      message: 'Game score recorded successfully!',
      data: created
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to record score: ' + err.message
    });
  }
});

/**
 * DELETE /api/config/scoreboard/:id
 * Removes a recorded heat score
 */
router.delete('/scoreboard/:id', requireAdminAuth, verifyCsrf, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteGameScore(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Score record not found.'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Score deleted successfully.',
      data: deleted
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete score: ' + err.message
    });
  }
});

module.exports = router;
