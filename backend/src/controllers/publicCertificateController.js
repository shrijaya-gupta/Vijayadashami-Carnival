const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const {
  generateCertificatePdf,
  buildVerificationUrl
} = require('../services/certificateService');

/**
 * GET /api/certificates/verify/:token
 * Public certificate authenticity verification endpoint.
 * Accepts either a cryptographic verificationToken or a Certificate ID.
 * Strictly preserves participant privacy (NO phone, roll number, course, or db _id).
 */
async function verifyCertificatePublic(req, res, next) {
  try {
    const rawRef = req.params.token ? req.params.token.trim() : '';

    if (!rawRef) {
      return res.status(400).json({
        success: false,
        status: 'not_found',
        message: 'A verification token or Certificate ID is required.'
      });
    }

    // Lookup by verificationToken OR certificateId
    const cert = await Certificate.findOne({
      $or: [
        { verificationToken: rawRef },
        { certificateId: rawRef.toUpperCase() }
      ]
    }).lean();

    if (!cert) {
      return res.status(404).json({
        success: false,
        status: 'not_found',
        message: 'Certificate could not be verified. The provided verification reference is invalid or non-existent.'
      });
    }

    // Check if certificate was revoked
    if (cert.status === 'revoked') {
      return res.status(200).json({
        success: false,
        status: 'revoked',
        message: 'This participation certificate has been revoked and is no longer valid.',
        certificate: {
          certificateId: cert.certificateId,
          status: 'revoked',
          revokedAt: cert.revokedAt || null
        }
      });
    }

    // Valid certificate: return strictly sanitized public attributes
    const origin = req.protocol + '://' + req.get('host');
    const verifyUrl = buildVerificationUrl(cert.verificationToken, origin);

    return res.status(200).json({
      success: true,
      status: 'valid',
      message: 'Certificate verified as authentic and valid.',
      certificate: {
        certificateId: cert.certificateId,
        participantName: cert.participantName,
        eventName: cert.eventName,
        eventDate: cert.eventDate,
        eventVenue: cert.eventVenue,
        certificateType: cert.certificateType,
        gamesParticipated: cert.gamesParticipated || [],
        issuedAt: cert.issuedAt,
        status: 'valid',
        verificationToken: cert.verificationToken,
        verifyUrl,
        downloadUrl: `/api/certificates/download/${cert.verificationToken}`
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/certificates/download/:token
 * Public PDF download endpoint for verified participation certificate
 */
async function downloadCertificatePublic(req, res, next) {
  try {
    const rawRef = req.params.token ? req.params.token.trim() : '';

    const cert = await Certificate.findOne({
      $or: [
        { verificationToken: rawRef },
        { certificateId: rawRef.toUpperCase() }
      ]
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
    }

    if (cert.status === 'revoked') {
      return res.status(403).json({
        success: false,
        message: 'This certificate has been revoked. Download is disabled.'
      });
    }

    const origin = req.protocol + '://' + req.get('host');
    const verifyUrl = buildVerificationUrl(cert.verificationToken, origin);

    const pdfBuffer = await generateCertificatePdf(cert, verifyUrl);

    // Sanitize filename
    const safeFilename = cert.certificateId.replace(/[^A-Za-z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/certificates/student/:registrationId
 * Allows registered students to check their certificate readiness and download if eligible
 */
async function checkStudentCertificateStatus(req, res, next) {
  try {
    const { registrationId } = req.params;
    const cleanId = (registrationId || '').trim().toUpperCase();

    const registration = await Registration.findOne({ registrationId: cleanId }).lean();
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `Registration ID '${cleanId}' was not found. Please verify your registration number.`
      });
    }

    // 1. Not verified yet
    if (registration.participationStatus !== 'verified') {
      return res.status(200).json({
        success: true,
        registrationId: registration.registrationId,
        studentName: registration.student?.fullName,
        participationStatus: registration.participationStatus || 'unverified',
        certificateIssued: false,
        message: 'Participation has not been verified yet. Certificates will be enabled after actual event attendance is verified by organizers.'
      });
    }

    // 2. Verified, but certificate not issued yet
    if (!registration.certificateIssued || !registration.certificateId) {
      return res.status(200).json({
        success: true,
        registrationId: registration.registrationId,
        studentName: registration.student?.fullName,
        participationStatus: 'verified',
        certificateIssued: false,
        message: 'Participation is verified! Your certificate is queued for issuance by the event organizers.'
      });
    }

    // 3. Certificate issued: retrieve certificate details
    const cert = await Certificate.findOne({ certificateId: registration.certificateId }).lean();
    if (!cert) {
      return res.status(200).json({
        success: true,
        registrationId: registration.registrationId,
        studentName: registration.student?.fullName,
        participationStatus: 'verified',
        certificateIssued: false,
        message: 'Certificate record is processing. Please check back shortly.'
      });
    }

    const origin = req.protocol + '://' + req.get('host');
    const verifyUrl = buildVerificationUrl(cert.verificationToken, origin);

    return res.status(200).json({
      success: true,
      registrationId: registration.registrationId,
      studentName: registration.student?.fullName,
      participationStatus: 'verified',
      certificateIssued: true,
      certificate: {
        certificateId: cert.certificateId,
        status: cert.status,
        issuedAt: cert.issuedAt,
        downloadUrl: `/api/certificates/download/${cert.verificationToken}`,
        verifyUrl
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  verifyCertificatePublic,
  downloadCertificatePublic,
  checkStudentCertificateStatus
};
