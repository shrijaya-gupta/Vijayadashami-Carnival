const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const {
  issueCertificateForRegistration,
  revokeCertificate,
  generateCertificatePdf,
  buildVerificationUrl
} = require('../services/certificateService');

/**
 * GET /api/admin/certificates/participants
 * Returns all participants with their participation verification and certificate status
 */
async function getParticipantsWithCertificateStatus(req, res, next) {
  try {
    const { search, participationStatus, game, page = 1, limit = 50 } = req.query;

    const query = {};

    // 1. Text search by name, roll number, or registration ID
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const regex = new RegExp(cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { registrationId: regex },
        { 'student.fullName': regex },
        { 'student.rollNumber': regex }
      ];
    }

    // 2. Filter by participation status
    if (participationStatus && ['unverified', 'verified', 'absent'].includes(participationStatus)) {
      query.participationStatus = participationStatus;
    }

    // 3. Filter by game
    if (game && game !== 'all') {
      query['selectedGames.gameId'] = game;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [participants, totalCount] = await Promise.all([
      Registration.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('registrationId student selectedGames status participationStatus participationVerifiedAt participationVerifiedBy certificateIssued certificateId createdAt')
        .lean(),
      Registration.countDocuments(query)
    ]);

    // Also fetch certificate tokens for any issued certificates so admin can link to verify/download
    const certIds = participants.filter(p => p.certificateId).map(p => p.certificateId);
    let certMap = {};
    if (certIds.length > 0) {
      const certs = await Certificate.find({ certificateId: { $in: certIds } })
        .select('certificateId verificationToken status issuedAt')
        .lean();
      certs.forEach(c => {
        certMap[c.certificateId] = c;
      });
    }

    const sanitizedParticipants = participants.map(p => {
      const cert = p.certificateId ? certMap[p.certificateId] : null;
      return {
        registrationId: p.registrationId,
        studentName: p.student?.fullName || '',
        rollNumber: p.student?.rollNumber || '',
        course: p.student?.course || '',
        branch: p.student?.branch || '',
        selectedGames: (p.selectedGames || []).map(g => ({
          gameId: g.gameId,
          gameName: g.gameName,
          participationType: g.participationType
        })),
        registrationStatus: p.status,
        participationStatus: p.participationStatus || 'unverified',
        participationVerifiedAt: p.participationVerifiedAt,
        participationVerifiedBy: p.participationVerifiedBy,
        certificateIssued: Boolean(p.certificateIssued),
        certificateId: p.certificateId || null,
        certificateStatus: cert ? cert.status : null,
        verificationToken: cert ? cert.verificationToken : null,
        registeredAt: p.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
      participants: sanitizedParticipants
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/certificates/verify-participation/:registrationId
 * Marks a participant's attendance as verified by an authorized organizer
 */
async function verifyParticipation(req, res, next) {
  try {
    const { registrationId } = req.params;
    const adminUser = req.admin?.username || 'admin';

    const registration = await Registration.findOne({ registrationId: registrationId.toUpperCase() });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `Registration not found: ${registrationId}`
      });
    }

    registration.participationStatus = 'verified';
    registration.participationVerifiedAt = new Date();
    registration.participationVerifiedBy = adminUser;
    await registration.save();

    console.log(`[ADMIN AUDIT] Participation verified for ${registration.registrationId} (${registration.student?.fullName}) by admin '${adminUser}'`);

    return res.status(200).json({
      success: true,
      message: `Participation verified for ${registration.student?.fullName}. Certificate issuance is now enabled.`,
      registration: {
        registrationId: registration.registrationId,
        studentName: registration.student?.fullName,
        participationStatus: registration.participationStatus,
        participationVerifiedAt: registration.participationVerifiedAt,
        participationVerifiedBy: registration.participationVerifiedBy,
        certificateIssued: registration.certificateIssued
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/certificates/revoke-verification/:registrationId
 * Revokes attendance verification if marked in error
 */
async function revokeParticipationVerification(req, res, next) {
  try {
    const { registrationId } = req.params;
    const adminUser = req.admin?.username || 'admin';

    const registration = await Registration.findOne({ registrationId: registrationId.toUpperCase() });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `Registration not found: ${registrationId}`
      });
    }

    registration.participationStatus = 'unverified';
    registration.participationVerifiedAt = null;
    registration.participationVerifiedBy = null;
    await registration.save();

    // If a certificate was previously issued, revoke it too so it cannot be used
    if (registration.certificateId) {
      await Certificate.updateOne(
        { certificateId: registration.certificateId },
        {
          $set: {
            status: 'revoked',
            revokedAt: new Date(),
            revokedBy: adminUser,
            revocationReason: 'Participation verification was revoked by organizer'
          }
        }
      );
      registration.certificateIssued = false;
      await registration.save();
    }

    console.log(`[ADMIN AUDIT] Participation verification revoked for ${registration.registrationId} by admin '${adminUser}'`);

    return res.status(200).json({
      success: true,
      message: `Participation verification revoked for ${registration.student?.fullName}.`,
      registration: {
        registrationId: registration.registrationId,
        studentName: registration.student?.fullName,
        participationStatus: registration.participationStatus,
        certificateIssued: registration.certificateIssued
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/certificates/issue/:registrationId
 * Issues a genuine participation certificate only after participation is verified
 */
async function issueCertificate(req, res, next) {
  try {
    const { registrationId } = req.params;
    const adminUser = req.admin?.username || 'admin';

    const { certificate, alreadyIssued } = await issueCertificateForRegistration(registrationId, adminUser);

    console.log(`[ADMIN AUDIT] Certificate ${certificate.certificateId} issued for ${registrationId} (${certificate.participantName}) by '${adminUser}' (alreadyIssued: ${alreadyIssued})`);

    const origin = req.protocol + '://' + req.get('host');
    const verifyUrl = buildVerificationUrl(certificate.verificationToken, origin);

    return res.status(alreadyIssued ? 200 : 201).json({
      success: true,
      message: alreadyIssued
        ? 'Certificate was already issued for this participant.'
        : 'Certificate generated and issued successfully.',
      certificate: {
        certificateId: certificate.certificateId,
        registrationId: certificate.registrationId,
        participantName: certificate.participantName,
        eventName: certificate.eventName,
        eventDate: certificate.eventDate,
        certificateType: certificate.certificateType,
        status: certificate.status,
        issuedAt: certificate.issuedAt,
        issuedBy: certificate.issuedBy,
        verificationToken: certificate.verificationToken,
        verifyUrl,
        downloadUrl: `/api/certificates/download/${certificate.verificationToken}`
      }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/admin/certificates/:certificateId/revoke
 * Revokes an issued certificate
 */
async function revokeCertificateEndpoint(req, res, next) {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body || {};
    const adminUser = req.admin?.username || 'admin';

    const cert = await revokeCertificate(certificateId, adminUser, reason);

    console.log(`[ADMIN AUDIT] Certificate ${certificateId} revoked by '${adminUser}'. Reason: ${reason || 'N/A'}`);

    return res.status(200).json({
      success: true,
      message: `Certificate ${cert.certificateId} has been revoked successfully.`,
      certificate: {
        certificateId: cert.certificateId,
        status: cert.status,
        revokedAt: cert.revokedAt,
        revokedBy: cert.revokedBy,
        revocationReason: cert.revocationReason
      }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/admin/certificates/:certificateId/download
 * Admin PDF download endpoint
 */
async function adminDownloadCertificatePdf(req, res, next) {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId: certificateId.toUpperCase() });
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const origin = req.protocol + '://' + req.get('host');
    const verifyUrl = buildVerificationUrl(cert.verificationToken, origin);

    const pdfBuffer = await generateCertificatePdf(cert, verifyUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cert.certificateId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getParticipantsWithCertificateStatus,
  verifyParticipation,
  revokeParticipationVerification,
  issueCertificate,
  revokeCertificateEndpoint,
  adminDownloadCertificatePdf
};
