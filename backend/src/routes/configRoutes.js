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
 * Returns public authoritative event configuration merged with live database settings
 */
router.get('/', async (req, res) => {
  try {
    const liveConfig = await db.getEventConfig();
    const merged = {
      ...EVENT_CONFIG,
      allAccessPassFee: liveConfig.pass_fee,
      feePerGame: liveConfig.pass_fee,
      registrationOpen: liveConfig.registration_open,
      requireUtr: liveConfig.require_utr,
      paymentMode: liveConfig.payment_mode,
      payment: {
        ...EVENT_CONFIG.payment,
        upiId: liveConfig.upi_id,
        merchantName: liveConfig.upi_name,
        qrImageUrl: liveConfig.qr_image_url,
        isConfigured: liveConfig.is_qr_active
      },
      whatsapp: {
        ...EVENT_CONFIG.whatsapp,
        inviteUrl: liveConfig.whatsapp_group_url
      },
      announcement: liveConfig.announcement
    };
    res.status(200).json({
      success: true,
      data: merged
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: EVENT_CONFIG
    });
  }
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
        upi_name: 'Shrijaya Gupta',
        payment_mobile: '8858500856',
        qr_image_url: '/assets/official-upi-qr.jpg',
        is_qr_active: true,
        require_utr: true,
        pass_fee: 10,
        registration_open: true,
        payment_mode: 'online_upi'
      }
    });
  }
});

/**
 * POST /api/config/payment-qr (and alias /api/config/event-settings)
 * Updates live event configuration, fee, UPI details, and UTR requirements in Supabase
 */
const handleUpdateEventConfig = async (req, res) => {
  try {
    const { 
      upi_id, 
      upi_name, 
      payment_mobile,
      qr_image_url, 
      is_qr_active,
      require_utr,
      pass_fee,
      registration_open,
      payment_mode,
      whatsapp_group_url,
      announcement
    } = req.body || {};

    const updated = await db.updateEventConfig({
      upi_id, 
      upi_name, 
      payment_mobile,
      qr_image_url, 
      is_qr_active,
      require_utr,
      pass_fee,
      registration_open,
      payment_mode,
      whatsapp_group_url,
      announcement
    });

    res.status(200).json({
      success: true,
      message: 'Event & payment configuration synchronized with database successfully!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update database configuration: ' + err.message
    });
  }
};

router.post('/payment-qr', requireAdminAuth, verifyCsrf, handleUpdateEventConfig);
router.post('/event-settings', requireAdminAuth, verifyCsrf, handleUpdateEventConfig);

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
