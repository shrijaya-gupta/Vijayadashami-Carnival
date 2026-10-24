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
 * Validates Registration payload strictly against allowed fields and schema rules
 */
function validateRegistrationPayload(body) {
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

  // Sanitize and normalize payload if valid
  let sanitizedData = null;
  if (errors.length === 0) {
    const mobileNorm = validateAndNormalizeMobile(student.mobileNumber).normalized;
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
      feePerGame: 5,
      feeAmount: selectedGames.length * 5,
      feeCurrency: 'INR',
      paymentStatus: (body.paymentReference && typeof body.paymentReference === 'string' && body.paymentReference.trim())
        ? 'payment_verification_pending'
        : 'payment_pending',
      paymentReference: (body.paymentReference && typeof body.paymentReference === 'string')
        ? body.paymentReference.trim().slice(0, 100)
        : null
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
  validateAndNormalizeMobile
};
