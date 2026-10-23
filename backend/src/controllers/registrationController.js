const Registration = require('../models/Registration');
const { validateRegistrationPayload } = require('../validators/registrationValidator');

/**
 * Creates a new registration or returns an existing one if idempotency key matches
 * POST /api/registrations
 */
async function createRegistration(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;

    // 1. Idempotency Check: if key provided, check if already recorded
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existing = await Registration.findOne({ idempotencyKey: idempotencyKey.trim() });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Registration retrieved from previous successful submission.',
          data: formatRegistrationResponse(existing),
          isDuplicateRetry: true
        });
      }
    }

    // 2. Server-side validation
    const validation = validateRegistrationPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    const { sanitizedData } = validation;

    // 3. Duplicate check for rapid double-submission (same student, same roll, same games within 5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await Registration.findOne({
      'student.rollNumber': sanitizedData.student.rollNumber,
      'student.course': sanitizedData.student.course,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (recentDuplicate) {
      // Check if selected game IDs are identical
      const existingGameIds = recentDuplicate.selectedGames.map(g => g.gameId).sort().join(',');
      const newGameIds = sanitizedData.selectedGames.map(g => g.gameId).sort().join(',');

      if (existingGameIds === newGameIds) {
        // Return existing registration to prevent accidental duplicate entries
        return res.status(200).json({
          success: true,
          message: 'Existing registration found for this student. Duplicate submission prevented.',
          data: formatRegistrationResponse(recentDuplicate),
          isDuplicateRetry: true
        });
      }
    }

    // 4. Save registration in MongoDB with collision handling
    const newDoc = await Registration.createWithCollisionHandling({
      ...sanitizedData,
      idempotencyKey: idempotencyKey ? idempotencyKey.trim() : undefined,
      clientIp: req.ip || req.connection?.remoteAddress
    });

    // 5. Return success only after record is saved
    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully.',
      data: formatRegistrationResponse(newDoc)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves safe minimal confirmation details for a student's registration
 * GET /api/registrations/:registrationId
 */
async function getRegistrationById(req, res, next) {
  try {
    const { registrationId } = req.params;

    if (!registrationId || typeof registrationId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Registration ID parameter is required.'
      });
    }

    const doc = await Registration.findOne({
      registrationId: registrationId.trim().toUpperCase()
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `No registration found for reference ID '${registrationId}'.`
      });
    }

    // Optional roll number verification query parameter (?rollNumber=...)
    const requestedRoll = req.query.rollNumber;
    if (requestedRoll && typeof requestedRoll === 'string') {
      if (doc.student.rollNumber.toLowerCase() !== requestedRoll.trim().toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: 'Verification details do not match the specified registration reference.'
        });
      }
    }

    // Return safe confirmation details without exposing private phone numbers
    return res.status(200).json({
      success: true,
      data: formatRegistrationResponse(doc)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submits an online payment reference / UTR for organizer verification
 * POST /api/registrations/:registrationId/payment-reference
 */
async function submitPaymentReference(req, res, next) {
  try {
    const { registrationId } = req.params;
    const { paymentReference } = req.body || {};

    if (!paymentReference || typeof paymentReference !== 'string' || !paymentReference.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A valid payment transaction reference or UTR number is required.'
      });
    }

    const doc = await Registration.findOne({
      registrationId: registrationId.trim().toUpperCase()
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `No registration found for reference ID '${registrationId}'.`
      });
    }

    // If already verified/paid, don't revert
    if (doc.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'This registration has already been verified as paid.',
        data: formatRegistrationResponse(doc)
      });
    }

    doc.paymentReference = paymentReference.trim().slice(0, 100);
    doc.paymentStatus = 'payment_verification_pending';
    await doc.save();

    return res.status(200).json({
      success: true,
      message: 'Payment reference submitted. Your payment status is now Payment Verification Pending.',
      data: formatRegistrationResponse(doc)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolves standard human-readable payment status label
 */
function getPaymentStatusLabel(status) {
  switch (status) {
    case 'paid':
      return 'Payment Verified';
    case 'payment_verification_pending':
      return 'Payment Verification Pending';
    case 'payment_failed':
      return 'Payment Failed';
    case 'waived':
      return 'Payment Waived';
    case 'pending_desk_collection':
      return 'Payment Pending (Desk Collection)';
    case 'payment_pending':
    case 'pending':
    default:
      return 'Payment Pending';
  }
}

/**
 * Formats a registration Mongoose document into a safe response object
 */
function formatRegistrationResponse(doc) {
  return {
    registrationId: doc.registrationId,
    eventName: 'Vijayadashami Carnival',
    date: 'Thursday, 29 October 2026',
    time: '11:00 AM',
    venue: 'SRMU Campus, B5',
    status: doc.status,
    student: {
      fullName: doc.student.fullName,
      rollNumber: doc.student.rollNumber,
      course: doc.student.course,
      branch: doc.student.branch,
      academicYear: doc.student.academicYear
      // Note: full mobile number is omitted from public response for privacy
    },
    selectedGames: doc.selectedGames.map(g => ({
      gameId: g.gameId,
      gameName: g.gameName,
      participationType: g.participationType,
      teamName: g.teamName || undefined,
      teamMembersCount: g.participationType === 'team' ? (g.teamMembers.length + 1) : 1,
      teamMembers: g.participationType === 'team'
        ? g.teamMembers.map(m => ({ name: m.name, roll: m.roll || undefined }))
        : undefined
    })),
    fee: {
      feePerGame: doc.feePerGame || 5,
      selectedGamesCount: doc.selectedGames.length,
      totalAmount: doc.feeAmount !== undefined ? doc.feeAmount : (doc.selectedGames.length * 5),
      currency: doc.feeCurrency || 'INR',
      formattedTotal: `₹${doc.feeAmount !== undefined ? doc.feeAmount : (doc.selectedGames.length * 5)}`,
      paymentStatus: doc.paymentStatus || 'payment_pending',
      paymentReference: doc.paymentReference || null,
      paymentStatusLabel: getPaymentStatusLabel(doc.paymentStatus)
    },
    feeAmount: doc.feeAmount !== undefined ? doc.feeAmount : (doc.selectedGames.length * 5),
    paymentStatus: doc.paymentStatus || 'payment_pending',
    paymentReference: doc.paymentReference || null,
    createdAt: doc.createdAt
  };
}

module.exports = {
  createRegistration,
  getRegistrationById,
  submitPaymentReference
};
