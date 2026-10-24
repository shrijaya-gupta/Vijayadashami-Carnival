const Registration = require('../models/Registration');
const { GAMES_CATALOGUE, LEGACY_GAMES, VALID_GAME_IDS, ALL_KNOWN_GAME_IDS, getGameById } = require('../config/gamesCatalogue');

/**
 * Helper to mask sensitive phone numbers in list and overview views
 */
function maskPhoneNumber(phone) {
  if (!phone) return 'Not Provided';
  const clean = String(phone).trim();
  if (clean.length < 4) return 'Protected';
  return '••••••' + clean.slice(-4);
}

/**
 * Helper to sanitize cell values against CSV Formula Injection (CWE-1236)
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();

  // If value begins with dangerous formula characters, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

/**
 * GET /api/admin/dashboard
 * Aggregates statistics from actual database records
 */
async function getDashboardStats(req, res, next) {
  try {
    const db = require('../config/supabase');
    const allRecordsRaw = await db.getAllRegistrations();
    
    // Normalize records to consistent schema and ensure valid numeric fee values
    const allRecords = allRecordsRaw.map(r => {
      const games = r.selected_games || r.selectedGames || [];
      const rawFee = r.total_amount != null ? Number(r.total_amount) : (r.totalAmount != null ? Number(r.totalAmount) : (r.fee_amount != null ? Number(r.fee_amount) : Number(r.feeAmount)));
      const hasReliableFee = !isNaN(rawFee) && rawFee > 0;
      const fee = hasReliableFee ? rawFee : 10;
      
      const st = String(r.status || 'confirmed').trim().toLowerCase();
      const ps = String(r.payment_status || r.paymentStatus || 'payment_pending').trim().toLowerCase();
      const att = String(r.attendance_status || r.attendanceStatus || 'pending').trim().toLowerCase();
      const partVerified = att === 'verified' || String(r.participationStatus || '').toLowerCase() === 'verified';

      return {
        ...r,
        registrationId: r.registration_id || r.registrationId,
        student: r.student || {},
        selectedGames: games,
        totalAmount: fee,
        feeAmount: fee,
        hasReliableFee,
        status: st,
        paymentStatus: ps,
        attendanceStatus: att,
        participationStatus: partVerified ? 'verified' : 'unverified',
        certificateIssued: Boolean(r.certificateIssued || r.certificate_id),
        createdAt: r.created_at || r.createdAt || new Date().toISOString()
      };
    });

    const totalRegistrations = allRecords.length;
    const cancelledCount = allRecords.filter(r => r.status === 'cancelled').length;
    const confirmedCount = allRecords.filter(r => r.status === 'confirmed').length;
    const pendingCount = allRecords.filter(r => r.status === 'pending').length;
    
    // Total valid active passes (all non-cancelled registrations)
    const totalActivePasses = allRecords.filter(r => r.status !== 'cancelled').length;

    const verifiedParticipantsCount = allRecords.filter(r => r.status !== 'cancelled' && r.participationStatus === 'verified').length;
    const certificatesIssuedCount = allRecords.filter(r => r.status !== 'cancelled' && r.certificateIssued).length;

    // Payment status counts (only for active, non-cancelled passes)
    const paidRecords = allRecords.filter(r => r.status !== 'cancelled' && (r.paymentStatus === 'paid' || r.paymentStatus === 'verified'));
    const paidPaymentsCount = paidRecords.length;

    const pendingVerificationCount = allRecords.filter(r => r.status !== 'cancelled' && r.paymentStatus === 'payment_verification_pending').length;
    const pendingPaymentCount = allRecords.filter(r => r.status !== 'cancelled' && ['pending', 'pending_desk_collection', 'payment_pending'].includes(r.paymentStatus)).length;
    const failedPaymentCount = allRecords.filter(r => r.paymentStatus === 'payment_failed' || r.paymentStatus === 'rejected').length;

    // Missing fee audit tracking
    const missingFeePaidCount = paidRecords.filter(r => !r.hasReliableFee).length;
    const missingFeeTotalCount = allRecords.filter(r => !r.hasReliableFee).length;

    // Verified Revenue: Sum stored fees for eligible active registrations with verified payment
    const verifiedRevenue = paidRecords.reduce((sum, r) => sum + r.totalAmount, 0);

    // Potential Revenue (Estimate): Sum expected fees across all active (non-cancelled) passes
    const activeRegistrations = allRecords.filter(r => r.status !== 'cancelled');
    const potentialRevenue = activeRegistrations.reduce((sum, r) => sum + r.totalAmount, 0);

    // Game breakdown for active registrations
    let totalSelectedGameEntries = 0;
    let totalIndividualEntries = 0;
    let totalTeamEntries = 0;
    let totalTeamMembersListed = 0;

    const gameMetrics = {};
    let gamesListForMetrics = [...GAMES_CATALOGUE, ...LEGACY_GAMES];
    try {
      const gamesStore = require('../services/gamesStore');
      const storeGames = gamesStore.getAllGames({ includeInactive: true });
      if (Array.isArray(storeGames) && storeGames.length > 0) {
        gamesListForMetrics = storeGames;
      }
    } catch (e) {}

    gamesListForMetrics.forEach(g => {
      gameMetrics[g.id] = {
        id: g.id,
        name: g.name,
        category: g.category || 'Event Game',
        rulesApprovalStatus: g.rulesApprovalStatus || 'Approved & Active',
        totalEntries: 0,
        individualEntries: 0,
        teamEntries: 0,
        teamMembersCount: 0
      };
    });

    activeRegistrations.forEach(reg => {
      if (Array.isArray(reg.selectedGames)) {
        reg.selectedGames.forEach(sg => {
          totalSelectedGameEntries++;
          const isTeam = sg.participationType === 'team';

          if (isTeam) {
            totalTeamEntries++;
            const membersLen = Array.isArray(sg.teamMembers) ? sg.teamMembers.length : 0;
            totalTeamMembersListed += membersLen;
          } else {
            totalIndividualEntries++;
          }

          const gId = sg.gameId || sg.id;
          if (gameMetrics[gId]) {
            gameMetrics[gId].totalEntries++;
            if (isTeam) {
              gameMetrics[gId].teamEntries++;
              const membersLen = Array.isArray(sg.teamMembers) ? sg.teamMembers.length : 0;
              gameMetrics[gId].teamMembersCount += membersLen;
            } else {
              gameMetrics[gId].individualEntries++;
            }
          }
        });
      }
    });

    // 5 most recent registrations
    const recentDocs = [...allRecords]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const recentRegistrations = recentDocs.map(doc => ({
      registrationId: doc.registrationId,
      studentName: doc.student?.fullName || 'Participant',
      rollNumber: doc.student?.rollNumber || '',
      maskedMobile: maskPhoneNumber(doc.student?.mobileNumber),
      course: doc.student?.course || '',
      gamesCount: doc.selectedGames ? doc.selectedGames.length : 0,
      games: doc.selectedGames ? doc.selectedGames.map(g => g.gameName || g.gameId) : [],
      status: doc.status || 'confirmed',
      createdAt: doc.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRegistrations,
          totalActivePasses,
          confirmedRegistrations: confirmedCount,
          cancelledRegistrations: cancelledCount,
          pendingRegistrations: pendingCount,
          verifiedParticipantsCount,
          certificatesIssuedCount,
          paidPaymentsCount,
          pendingVerificationCount,
          pendingPaymentCount,
          failedPaymentCount,
          verifiedRevenue,
          potentialRevenue,
          passFee: 10,
          missingFeePaidCount,
          missingFeeTotalCount,
          hasMissingFeeRecords: missingFeeTotalCount > 0,
          totalSelectedGameEntries,
          totalIndividualEntries,
          totalTeamEntries,
          totalTeamMembersListed
        },
        gameStats: Object.values(gameMetrics),
        recentRegistrations,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Builds MongoDB filter query from request parameters
 */
function buildFilterQuery(queryParams) {
  const query = {};

  // Search keyword (matches registrationId, student name, roll number, payment UTR, or mobile)
  if (queryParams.search && queryParams.search.trim()) {
    const term = queryParams.search.trim();
    // Escape regex characters
    const safeRegex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { registrationId: safeRegex },
      { 'student.fullName': safeRegex },
      { 'student.rollNumber': safeRegex },
      { 'student.mobileNumber': safeRegex },
      { paymentReference: safeRegex }
    ];
  }

  // Filter by Game ID
  if (queryParams.game && queryParams.game.trim() && queryParams.game !== 'all') {
    query['selectedGames.gameId'] = queryParams.game.trim();
  }

  // Filter by Participation Format (individual vs team)
  if (queryParams.format && ['individual', 'team'].includes(queryParams.format.trim())) {
    query['selectedGames.participationType'] = queryParams.format.trim();
  }

  // Filter by Course
  if (queryParams.course && queryParams.course.trim() && queryParams.course !== 'all') {
    query['student.course'] = queryParams.course.trim();
  }

  // Filter by Branch
  if (queryParams.branch && queryParams.branch.trim() && queryParams.branch !== 'all') {
    query['student.branch'] = queryParams.branch.trim();
  }

  // Filter by Academic Year
  if (queryParams.year && queryParams.year.trim() && queryParams.year !== 'all') {
    query['student.academicYear'] = queryParams.year.trim();
  }

  // Filter by Status
  if (queryParams.status && ['confirmed', 'cancelled', 'pending'].includes(queryParams.status.trim())) {
    query.status = queryParams.status.trim();
  }

  // Filter by Payment Status
  if (queryParams.paymentStatus && queryParams.paymentStatus.trim() && queryParams.paymentStatus !== 'all') {
    query.paymentStatus = queryParams.paymentStatus.trim();
  }

  return query;
}

/**
 * GET /api/admin/registrations
 * Searchable, filterable, paginated registration list with phone numbers masked
 */
async function getRegistrationsList(req, res, next) {
  try {
    const filter = buildFilterQuery(req.query);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const total = await Registration.countDocuments(filter);
    const docs = await Registration.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mask phone numbers in list view for privacy
    const registrations = docs.map(doc => ({
      _id: doc._id,
      registrationId: doc.registrationId,
      student: {
        fullName: doc.student.fullName,
        maskedMobile: maskPhoneNumber(doc.student.mobileNumber),
        rollNumber: doc.student.rollNumber,
        course: doc.student.course,
        branch: doc.student.branch,
        academicYear: doc.student.academicYear,
        whatsAppConsent: doc.student.whatsAppConsent !== false
      },
      selectedGames: doc.selectedGames.map(g => ({
        gameId: g.gameId,
        gameName: g.gameName,
        participationType: g.participationType,
        teamName: g.teamName || '',
        teamMembersCount: Array.isArray(g.teamMembers) ? g.teamMembers.length : 0
      })),
      feeAmount: doc.totalAmount != null ? doc.totalAmount : (doc.feeAmount != null ? doc.feeAmount : 10),
      paymentStatus: doc.paymentStatus || 'pending_desk_collection',
      paymentReference: doc.paymentReference || null,
      paymentVerifiedAt: doc.paymentVerifiedAt || null,
      paymentVerifiedBy: doc.paymentVerifiedBy || null,
      status: doc.status || 'confirmed',
      createdAt: doc.createdAt
    }));

    return res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/registrations/:registrationId
 * Full details including unmasked mobile number for verified organizer inspection
 */
async function getRegistrationDetails(req, res, next) {
  try {
    const regId = (req.params.registrationId || '').trim().toUpperCase();
    const doc = await Registration.findOne({ registrationId: regId }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `No registration record found for ID: ${regId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: doc
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/registrations/:registrationId
 * Updates registration status (confirmed, cancelled, pending) with audit record
 */
async function updateRegistrationStatus(req, res, next) {
  try {
    const regId = (req.params.registrationId || '').trim().toUpperCase();
    const { status, paymentStatus, notes } = req.body || {};

    const validStatuses = ['confirmed', 'cancelled', 'pending'];
    const validPaymentStatuses = ['pending', 'pending_desk_collection', 'payment_pending', 'payment_verification_pending', 'paid', 'payment_failed', 'waived'];

    if (!status && !paymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Either status or paymentStatus must be provided.'
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid paymentStatus. Must be one of: ${validPaymentStatuses.join(', ')}`
      });
    }

    const doc = await Registration.findOne({ registrationId: regId });
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `Registration record ${regId} not found`
      });
    }

    if (status) {
      doc.status = status;
    }

    if (paymentStatus) {
      doc.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        doc.paymentVerifiedAt = new Date();
        doc.paymentVerifiedBy = req.admin?.username || 'admin';
      }
    }

    await doc.save();

    console.log(`[ADMIN AUDIT] Registration ${regId} updated: status=${doc.status}, paymentStatus=${doc.paymentStatus} by admin '${req.admin?.username}'`);

    return res.status(200).json({
      success: true,
      message: `Registration updated successfully.`,
      registration: doc
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/registrations/:registrationId
 * Allows safe removal of test or duplicate records with authorization
 */
async function deleteRegistration(req, res, next) {
  try {
    const regId = (req.params.registrationId || '').trim().toUpperCase();

    const result = await Registration.findOneAndDelete({ registrationId: regId });
    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Registration ${regId} not found`
      });
    }

    console.log(`[ADMIN AUDIT] Registration ${regId} deleted by admin '${req.admin?.username}'`);

    return res.status(200).json({
      success: true,
      message: `Registration ${regId} was successfully removed.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/games/:gameId/registrations
 * Game-wise participant breakdown and roster list
 */
async function getGameParticipants(req, res, next) {
  try {
    const gameId = (req.params.gameId || '').trim();
    if (!ALL_KNOWN_GAME_IDS.includes(gameId)) {
      return res.status(404).json({
        success: false,
        error: `Invalid game ID '${gameId}'. Must belong to the event catalogue.`
      });
    }

    const gameDef = getGameById(gameId);

    // Fetch all registrations containing this game
    const docs = await Registration.find({
      'selectedGames.gameId': gameId,
      status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 }).lean();

    let individualEntries = 0;
    let teamEntries = 0;
    let totalPlayers = 0;

    const participants = docs.map(doc => {
      const gameSelection = doc.selectedGames.find(g => g.gameId === gameId);
      const isTeam = gameSelection?.participationType === 'team';

      if (isTeam) {
        teamEntries++;
        const rosterCount = Array.isArray(gameSelection.teamMembers) ? gameSelection.teamMembers.length : 0;
        totalPlayers += (1 + rosterCount); // Team leader + teammates
      } else {
        individualEntries++;
        totalPlayers += 1;
      }

      return {
        registrationId: doc.registrationId,
        studentName: doc.student.fullName,
        maskedMobile: maskPhoneNumber(doc.student.mobileNumber),
        rollNumber: doc.student.rollNumber,
        course: doc.student.course,
        branch: doc.student.branch,
        academicYear: doc.student.academicYear,
        participationType: gameSelection ? gameSelection.participationType : 'individual',
        teamName: gameSelection?.teamName || '',
        teamMembers: gameSelection?.teamMembers || [],
        createdAt: doc.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        game: gameDef,
        metrics: {
          totalRegistrations: docs.length,
          individualEntries,
          teamEntries,
          totalEstimatedPlayers: totalPlayers
        },
        participants
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/registrations/export
 * Generates CSV export with formula injection protection (CWE-1236)
 */
async function exportRegistrationsCsv(req, res, next) {
  try {
    const filter = buildFilterQuery(req.query);

    const docs = await Registration.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // CSV Headers
    const headers = [
      'Registration ID',
      'Student Name',
      'Roll Number',
      'Mobile Number (Protected)',
      'Course',
      'Branch',
      'Academic Year',
      'WhatsApp Consent',
      'Status',
      'Participation Status',
      'Certificate Issued',
      'Certificate ID',
      'Game Count',
      'Selected Games & Formats',
      'Team Details',
      'Registration Fee (INR)',
      'Payment Status',
      'Payment Reference',
      'Registration Date'
    ];

    const rows = [headers.join(',')];

    docs.forEach(doc => {
      const student = doc.student || {};
      const games = Array.isArray(doc.selectedGames) ? doc.selectedGames : [];
      
      const gameSummary = games
        .map(g => `${g.gameName || g.gameId} (${g.participationType === 'team' ? 'Team' : 'Solo'})`)
        .join('; ');

      const teamSummary = games
        .filter(g => g.participationType === 'team' && g.teamName)
        .map(g => `${g.gameName}: Team "${g.teamName}" (${Array.isArray(g.teamMembers) ? g.teamMembers.length : 0} members)`)
        .join('; ');

      const dateStr = doc.createdAt ? new Date(doc.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '';
      const feeCalculated = doc.totalAmount != null ? doc.totalAmount : (doc.feeAmount != null ? doc.feeAmount : 10);
      const payStatus = doc.paymentStatus || 'payment_pending';

      const row = [
        sanitizeCsvCell(doc.registrationId),
        sanitizeCsvCell(student.fullName),
        sanitizeCsvCell(student.rollNumber),
        sanitizeCsvCell(maskPhoneNumber(student.mobileNumber)),
        sanitizeCsvCell(student.course),
        sanitizeCsvCell(student.branch),
        sanitizeCsvCell(student.academicYear),
        sanitizeCsvCell(student.whatsAppConsent !== false ? 'YES' : 'NO'),
        sanitizeCsvCell(doc.status || 'confirmed'),
        sanitizeCsvCell(doc.participationStatus || 'unverified'),
        sanitizeCsvCell(doc.certificateIssued ? 'YES' : 'NO'),
        sanitizeCsvCell(doc.certificateId || 'N/A'),
        sanitizeCsvCell(games.length),
        sanitizeCsvCell(gameSummary),
        sanitizeCsvCell(teamSummary || 'None'),
        sanitizeCsvCell(`₹${feeCalculated}`),
        sanitizeCsvCell(payStatus),
        sanitizeCsvCell(doc.paymentReference || 'N/A'),
        sanitizeCsvCell(dateStr)
      ];

      rows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM for Excel compatibility
    const today = new Date().toISOString().slice(0, 10);
    const filename = `srmu-registrations-${today}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getRegistrationsList,
  getRegistrationDetails,
  updateRegistrationStatus,
  deleteRegistration,
  getGameParticipants,
  exportRegistrationsCsv
};
