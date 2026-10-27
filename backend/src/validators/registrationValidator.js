const { VALID_GAME_IDS, getGameById } = require('../config/gamesCatalogue');

/**
 * Validates and normalizes Indian mobile number
 * Accepts 10 digits starting with 6-9, optional +91 or 0 prefix
 */
function validateAndNormalizeMobile(rawMobile) {
  if (typeof rawMobile !== 'string') return { isValid: false };
  const trimmed = rawMobile.trim();
  const normalized = trimmed.replace(/[\s\-\(\)]/g, '');
  const indianMobileRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
  const match = normalized.match(indianMobileRegex);
  if (!match) return { isValid: false };

  // Store cleanly with standard +91 prefix
  return {
    isValid: true,
    normalized: `+91${match[1]}`
  };
}

/**
 * Validates and normalizes UPI UTR / Transaction Reference
 * Standard Indian UPI UTR is 12 numeric digits (e.g. 429810394821)
 * Bank IMPS/NEFT/Ref numbers can be 10-22 alphanumeric characters
 */
function validateAndNormalizeUtr(rawUtr) {
  if (typeof rawUtr !== 'string') {
    return { isValid: false, reason: 'UPI Transaction Reference (UTR) is required.' };
  }

  const trimmed = rawUtr.trim();
  if (!trimmed) {
    return { isValid: false, reason: 'UPI Transaction Reference (UTR) cannot be empty.' };
  }

  // Remove common prefixes like "UTR:", "TxnID:", etc. and remove whitespace / hyphens
  const cleaned = trimmed
    .replace(/^(utr|txn|ref|txnid|refno|upi|rrn)[\s\:\-\.]*/i, '')
    .replace(/[\s\-]/g, '');

  if (!cleaned) {
    return { isValid: false, reason: 'Please enter a valid UPI transaction reference number.' };
  }

  // Reject dummy, placeholder, or sequential strings
  const dummyPatterns = [
    /^0{6,}$/,                                        // All zeros
    /^1{6,}$/,                                        // All ones
    /^(\d)\1{7,}$/,                                   // 8+ identical repeated digits
    /^(12345678|01234567|98765432|abcdef)/i,          // Trivial sequences
    /^(test|dummy|demo|fake|na|none|null|nil|sample)/i // Text placeholders & test prefixes
  ];

  for (const pattern of dummyPatterns) {
    if (pattern.test(cleaned)) {
      return { 
        isValid: false, 
        reason: 'Please enter your genuine 12-digit UPI UTR from Google Pay, PhonePe, Paytm, or BHIM, not a placeholder.' 
      };
    }
  }

  // UPI UTR standard: exactly 12 numeric digits (or 10-22 alphanumeric banking reference)
  const is12Digit = /^\d{12}$/.test(cleaned);
  const isBankRef = /^[A-Za-z0-9]{10,22}$/.test(cleaned);

  if (!is12Digit && !isBankRef) {
    return {
      isValid: false,
      reason: 'UPI UTR must be exactly 12 numeric digits (e.g. 429810394821) or a valid 10–22 alphanumeric bank reference.'
    };
  }

  return {
    isValid: true,
    normalized: cleaned
  };
}

/**
 * Validates Registration payload strictly against allowed fields and schema rules
 */
function validateRegistrationPayload(body, options = {}) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const { student, selectedGames } = body;

  // 1. Student Object Validation
  if (!student || typeof student !== 'object') {
    errors.push('Student details object is required.');
  } else {
    // Full Name
    if (!student.fullName || typeof student.fullName !== 'string' || student.fullName.trim().length < 2) {
      errors.push('Student full name is required and must be at least 2 characters.');
    } else if (student.fullName.trim().length > 100) {
      errors.push('Student full name cannot exceed 100 characters.');
    }

    // Mobile Number
    const mobileCheck = validateAndNormalizeMobile(student.mobileNumber);
    if (!mobileCheck.isValid) {
      errors.push('Please provide a valid 10-digit Indian mobile number (e.g. 9876543210 or +919876543210).');
    }

    // Roll Number (Optional)
    if (student.rollNumber && typeof student.rollNumber === 'string' && student.rollNumber.trim().length > 50) {
      errors.push('Roll number cannot exceed 50 characters.');
    }

    // Course
    if (!student.course || typeof student.course !== 'string' || !student.course.trim()) {
      errors.push('Course is required.');
    } else if (student.course.trim().length > 100) {
      errors.push('Course cannot exceed 100 characters.');
    }

    // Branch
    if (!student.branch || typeof student.branch !== 'string' || !student.branch.trim()) {
      errors.push('Branch / department is required.');
    } else if (student.branch.trim().length > 100) {
      errors.push('Branch cannot exceed 100 characters.');
    }

    // Academic Year
    if (!student.academicYear || typeof student.academicYear !== 'string' || !student.academicYear.trim()) {
      errors.push('Academic year is required.');
    } else if (student.academicYear.trim().length > 50) {
      errors.push('Academic year cannot exceed 50 characters.');
    }
  }

  // 2. Selected Games Validation
  if (!Array.isArray(selectedGames) || selectedGames.length === 0) {
    errors.push('At least one game must be selected for participation.');
  } else if (selectedGames.length > 6) {
    errors.push('Cannot select more than 6 games.');
  } else {
    const seenGameIds = new Set();

    selectedGames.forEach((item, index) => {
      const prefix = `Game #${index + 1}:`;

      if (!item || typeof item !== 'object') {
        errors.push(`${prefix} Invalid game entry.`);
        return;
      }

      // Game ID validity
      if (!item.gameId || !VALID_GAME_IDS.includes(item.gameId)) {
        errors.push(`${prefix} Game ID '${item.gameId}' is not part of the official event catalogue.`);
        return;
      }

      // Check duplicates
      if (seenGameIds.has(item.gameId)) {
        errors.push(`${prefix} Game '${item.gameId}' cannot be selected multiple times in one registration.`);
      }
      seenGameIds.add(item.gameId);

      // Participation format
      if (!item.participationType || !['individual', 'team'].includes(item.participationType)) {
        errors.push(`${prefix} Participation type must be 'individual' or 'team'.`);
      }

      // Team Validation
      if (item.participationType === 'team') {
        if (!item.teamName || typeof item.teamName !== 'string' || !item.teamName.trim()) {
          errors.push(`${prefix} Team name is required for team participation.`);
        } else if (item.teamName.trim().length > 100) {
          errors.push(`${prefix} Team name cannot exceed 100 characters.`);
        }

        // Validate members if provided
        if (item.teamMembers !== undefined && !Array.isArray(item.teamMembers)) {
          errors.push(`${prefix} Team members must be an array.`);
        } else if (Array.isArray(item.teamMembers)) {
          if (item.teamMembers.length > 15) {
            errors.push(`${prefix} Team exceeds maximum allowed member roster (15 members).`);
          }
          item.teamMembers.forEach((member, mIdx) => {
            if (!member || typeof member !== 'object') {
              errors.push(`${prefix} Member #${mIdx + 1} details are invalid.`);
            } else if (!member.name || typeof member.name !== 'string' || member.name.trim().length < 2) {
              errors.push(`${prefix} Member #${mIdx + 1} name must be at least 2 characters.`);
            } else if (member.name.trim().length > 100) {
              errors.push(`${prefix} Member #${mIdx + 1} name cannot exceed 100 characters.`);
            }
          });
        }
      }
    });
  }

  // 3. Payment Mode & UTR Reference Validation
  const paymentMode = (body.paymentMode && typeof body.paymentMode === 'string') 
    ? body.paymentMode.trim().toLowerCase() 
    : 'online_upi';

  const requireUtr = options.requireUtr !== false; // default true: strictly requires UTR
  let finalPaymentStatus = 'payment_pending';
  let finalPaymentReference = null;

  if (paymentMode === 'cash_desk' || paymentMode === 'cash') {
    if (options.allowCash === false) {
      errors.push('Cash payment at the carnival desk is currently disabled. Please submit registration with online UPI payment and valid UTR.');
    } else {
      finalPaymentStatus = 'pending_desk_collection';
      finalPaymentReference = 'CASH_AT_DESK';
    }
  } else {
    // Online UPI Payment
    const rawRef = body.paymentReference;
    if (!rawRef || typeof rawRef !== 'string' || !rawRef.trim()) {
      if (requireUtr) {
        errors.push('UPI Transaction Reference (UTR / Ref ID) is strictly required for online registration. Please scan the QR code and enter the 12-digit UTR from your payment app.');
      } else {
        finalPaymentStatus = 'payment_pending';
        finalPaymentReference = null;
      }
    } else {
      const utrResult = validateAndNormalizeUtr(rawRef);
      if (!utrResult.isValid) {
        errors.push(utrResult.reason);
      } else {
        finalPaymentStatus = 'payment_verification_pending';
        finalPaymentReference = utrResult.normalized;
      }
    }
  }

  // Sanitize and normalize payload if valid
  let sanitizedData = null;
  if (errors.length === 0) {
    const mobileNorm = validateAndNormalizeMobile(student.mobileNumber).normalized;
    const configuredFee = typeof options.passFee === 'number' ? options.passFee : 10;
    const finalFee = body.totalAmount ? Number(body.totalAmount) : (body.feeAmount ? Number(body.feeAmount) : configuredFee);

    sanitizedData = {
      student: {
        fullName: student.fullName.trim(),
        mobileNumber: mobileNorm,
        rollNumber: (student.rollNumber && typeof student.rollNumber === 'string' && student.rollNumber.trim()) ? student.rollNumber.trim() : 'N/A',
        course: student.course.trim(),
        branch: student.branch.trim(),
        academicYear: student.academicYear.trim(),
        whatsAppConsent: typeof student.whatsAppConsent === 'boolean' ? student.whatsAppConsent : true
      },
      selectedGames: selectedGames.map(item => {
        const gameDef = getGameById(item.gameId);
        const format = item.participationType;
        const entry = {
          gameId: item.gameId,
          gameName: gameDef ? gameDef.name : item.gameName || item.gameId,
          participationType: format
        };

        if (format === 'team') {
          entry.teamName = item.teamName ? item.teamName.trim() : 'Unnamed Squad';
          entry.teamMembers = Array.isArray(item.teamMembers)
            ? item.teamMembers
                .filter(m => m && typeof m.name === 'string' && m.name.trim().length >= 2)
                .map(m => ({
                  name: m.name.trim(),
                  roll: (m.roll && typeof m.roll === 'string') ? m.roll.trim() : '',
                  contact: (m.contact && typeof m.contact === 'string') ? m.contact.trim() : ''
                }))
            : [];
        }

        return entry;
      }),
      feePerGame: configuredFee,
      feeAmount: finalFee,
      totalAmount: finalFee,
      feeCurrency: 'INR',
      paymentStatus: finalPaymentStatus,
      paymentReference: finalPaymentReference
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

module.exports = {
  validateRegistrationPayload,
  validateAndNormalizeMobile,
  validateAndNormalizeUtr
};
