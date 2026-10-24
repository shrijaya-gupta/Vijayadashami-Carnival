const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');

/**
 * Generates QR Code as a PNG Buffer pointing to the public verification URL
 * @param {string} verificationUrl
 * @returns {Promise<Buffer>}
 */
async function generateQrCodeBuffer(verificationUrl) {
  return await QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
    color: {
      dark: '#1E1B4B',
      light: '#FFFFFF'
    }
  });
}

/**
 * Builds the public verification URL for a given verification token
 * @param {string} token 
 * @param {string} [origin] 
 * @returns {string}
 */
function buildVerificationUrl(token, origin) {
  const configuredBase = process.env.PUBLIC_APP_URL || process.env.CLIENT_ORIGIN?.split(',')[0]?.trim();
  const base = (origin || configuredBase || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/verify-certificate/${encodeURIComponent(token)}`;
}

/**
 * Generates an elegant landscape A4 Participation Certificate PDF as a Buffer
 * @param {Object} cert - Certificate document
 * @param {string} verifyUrl - Full public HTTPS verification URL
 * @returns {Promise<Buffer>}
 */
async function generateCertificatePdf(cert, verifyUrl) {
  // Generate QR code buffer to embed in PDF
  const qrBuffer = await generateQrCodeBuffer(verifyUrl);

  return new Promise((resolve, reject) => {
    try {
      // Landscape A4 dimensions: 841.89 x 595.28 points
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 35, right: 35 },
        info: {
          Title: `Certificate of Participation - ${cert.participantName}`,
          Author: `${cert.eventName || 'Vijayadashami Carnival'} Organizing Committee`,
          Subject: 'Participation Certificate',
          Keywords: 'SRMU, Vijayadashami Carnival, Certificate, Participation'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const pageWidth = 841.89;
      const pageHeight = 595.28;

      // -------------------------------------------------------------
      // 1. DECORATIVE BORDERS & BACKGROUND
      // -------------------------------------------------------------
      // Subtle background fill
      doc.rect(0, 0, pageWidth, pageHeight).fill('#FAFAFE');

      // Outer decorative border (Deep Indigo)
      doc.lineWidth(4)
         .strokeColor('#4F46E5')
         .rect(24, 24, pageWidth - 48, pageHeight - 48)
         .stroke();

      // Middle thin gold border
      doc.lineWidth(1.5)
         .strokeColor('#F59E0B')
         .rect(30, 30, pageWidth - 60, pageHeight - 60)
         .stroke();

      // Inner faint purple border
      doc.lineWidth(0.8)
         .strokeColor('#C7D2FE')
         .rect(34, 34, pageWidth - 68, pageHeight - 68)
         .stroke();

      // Corner ornamental squares
      const cornerSize = 12;
      const corners = [
        [24, 24],
        [pageWidth - 24 - cornerSize, 24],
        [24, pageHeight - 24 - cornerSize],
        [pageWidth - 24 - cornerSize, pageHeight - 24 - cornerSize]
      ];
      corners.forEach(([cx, cy]) => {
        doc.rect(cx, cy, cornerSize, cornerSize).fill('#F59E0B');
      });

      // -------------------------------------------------------------
      // 2. HEADER: UNIVERSITY & EVENT TITLE
      // -------------------------------------------------------------
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#4B5563')
         .text('SHRI RAMSWAROOP MEMORIAL UNIVERSITY', 0, 52, {
           align: 'center',
           characterSpacing: 2
         });

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#6366F1')
         .text('CAMPUS B5-408 • ANNUAL FESTIVITY', 0, 70, {
           align: 'center',
           characterSpacing: 1.5
         });

      // Decorative divider
      doc.lineWidth(1)
         .strokeColor('#E0E7FF')
         .moveTo(pageWidth / 2 - 140, 88)
         .lineTo(pageWidth / 2 + 140, 88)
         .stroke();

      // Small diamond in center of divider
      doc.polygon(
        [pageWidth / 2, 84],
        [pageWidth / 2 + 5, 88],
        [pageWidth / 2, 92],
        [pageWidth / 2 - 5, 88]
      ).fill('#F59E0B');

      // -------------------------------------------------------------
      // 3. CERTIFICATE TITLE
      // -------------------------------------------------------------
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#1E1B4B')
         .text('CERTIFICATE OF PARTICIPATION', 0, 104, {
           align: 'center',
           characterSpacing: 1.2
         });

      doc.font('Helvetica')
         .fontSize(10.5)
         .fillColor('#6B7280')
         .text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', 0, 138, {
           align: 'center',
           characterSpacing: 1.5
         });

      // -------------------------------------------------------------
      // 4. PARTICIPANT'S NAME
      // -------------------------------------------------------------
      doc.font('Helvetica-Bold')
         .fontSize(28)
         .fillColor('#4338CA')
         .text(cert.participantName, 60, 160, {
           align: 'center',
           width: pageWidth - 120
         });

      // Underline accent beneath name
      doc.lineWidth(2)
         .strokeColor('#F59E0B')
         .moveTo(pageWidth / 2 - 120, 198)
         .lineTo(pageWidth / 2 + 120, 198)
         .stroke();

      // -------------------------------------------------------------
      // 5. EVENT CITATION & PARTICIPATION TEXT
      // -------------------------------------------------------------
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#374151')
         .text(
           'for active participation in the vibrant campus challenges and games at the',
           80, 215,
           { align: 'center', width: pageWidth - 160, lineGap: 4 }
         );

      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor('#1E1B4B')
         .text(cert.eventName || 'Vijayadashami Carnival', 80, 236, {
           align: 'center',
           width: pageWidth - 160
         });

      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#4B5563')
         .text(
           `held on ${cert.eventDate || 'Thursday, 29 October 2026'} at ${cert.eventVenue || 'SRMU Campus, B5-408'}.`,
           80, 258,
           { align: 'center', width: pageWidth - 160 }
         );

      // Games Participated list (if available)
      if (Array.isArray(cert.gamesParticipated) && cert.gamesParticipated.length > 0) {
        const gamesList = cert.gamesParticipated.join(' • ');
        doc.font('Helvetica-Oblique')
           .fontSize(10)
           .fillColor('#6366F1')
           .text(`Events: ${gamesList}`, 80, 282, {
             align: 'center',
             width: pageWidth - 160
           });
      }

      // -------------------------------------------------------------
      // 6. LOWER METADATA BAR & SIGNATORY SECTION
      // -------------------------------------------------------------
      const bottomSectionY = 380;

      // Divider line above footer
      doc.lineWidth(0.8)
         .strokeColor('#E2E8F0')
         .moveTo(60, bottomSectionY - 20)
         .lineTo(pageWidth - 60, bottomSectionY - 20)
         .stroke();

      // --- LEFT COLUMN: QR Code Verification ---
      const qrSize = 90;
      const qrX = 75;
      const qrY = bottomSectionY - 5;

      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      doc.font('Helvetica-Bold')
         .fontSize(8)
         .fillColor('#1E1B4B')
         .text('SCAN TO VERIFY', qrX, qrY + qrSize + 6, {
           width: qrSize,
           align: 'center'
         });

      doc.font('Helvetica')
         .fontSize(7)
         .fillColor('#6B7280')
         .text('Official QR Code', qrX, qrY + qrSize + 17, {
           width: qrSize,
           align: 'center'
         });

      // --- CENTER COLUMN: Certificate Credentials ---
      const centerX = 200;
      const centerWidth = pageWidth - 400;
      const infoY = bottomSectionY + 12;

      doc.font('Helvetica-Bold')
         .fontSize(9.5)
         .fillColor('#1E1B4B')
         .text(`Certificate ID: ${cert.certificateId}`, centerX, infoY, {
           align: 'center',
           width: centerWidth
         });

      const issueDateStr = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : (cert.eventDate || '29 October 2026');

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#4B5563')
         .text(`Issued On: ${issueDateStr}`, centerX, infoY + 16, {
           align: 'center',
           width: centerWidth
         });

      doc.font('Helvetica-Bold')
         .fontSize(8.5)
         .fillColor(cert.status === 'valid' ? '#059669' : '#DC2626')
         .text(`Verification Status: ${cert.status === 'valid' ? 'Verified & Valid' : 'REVOKED'}`, centerX, infoY + 32, {
           align: 'center',
           width: centerWidth
         });

      doc.font('Helvetica')
         .fontSize(7.5)
         .fillColor('#9CA3AF')
         .text('Official digital verification record maintained by SRMU Organizing Committee', centerX, infoY + 50, {
           align: 'center',
           width: centerWidth
         });

      // --- RIGHT COLUMN: Neutral Signatory Placeholder ---
      const sigX = pageWidth - 235;
      const sigWidth = 160;
      const sigY = bottomSectionY + 35;

      // Decorative signature line
      doc.lineWidth(1)
         .strokeColor('#4B5563')
         .moveTo(sigX, sigY)
         .lineTo(sigX + sigWidth, sigY)
         .stroke();

      doc.font('Helvetica-Bold')
         .fontSize(9.5)
         .fillColor('#1E1B4B')
         .text('Event Organizing Committee', sigX, sigY + 6, {
           width: sigWidth,
           align: 'center'
         });

      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#6B7280')
         .text(cert.eventName ? `${cert.eventName} 2026` : 'Vijayadashami Carnival 2026', sigX, sigY + 20, {
           width: sigWidth,
           align: 'center'
         });

      doc.font('Helvetica-Oblique')
         .fontSize(7)
         .fillColor('#9CA3AF')
         .text('(Authorized Signatory Placeholder)', sigX, sigY + 33, {
           width: sigWidth,
           align: 'center'
         });

      // Finish document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Issues a new participation certificate for an eligible verified participant
 * @param {string} registrationId
 * @param {string} adminUsername
 * @returns {Promise<{ certificate: Object, alreadyIssued: boolean }>}
 */
async function issueCertificateForRegistration(registrationId, adminUsername) {
  // 1. Fetch registration
  const registration = await Registration.findOne({ registrationId: registrationId.toUpperCase() });
  if (!registration) {
    const error = new Error(`Registration not found for ID: ${registrationId}`);
    error.status = 404;
    throw error;
  }

  // 2. Strict eligibility enforcement: must be participation-verified!
  if (registration.participationStatus !== 'verified') {
    const error = new Error('Participant attendance has not been verified. Only verified participants are eligible for a certificate.');
    error.status = 400;
    throw error;
  }

  // 3. Check if certificate already exists (idempotent duplicate prevention)
  let existingCert = await Certificate.findOne({
    registrationId: registration.registrationId
  });

  if (existingCert) {
    // If revoked, do not silently reuse without explicit unrevoking
    if (existingCert.status === 'revoked') {
      const error = new Error('Certificate for this registration was previously revoked. Please un-revoke or review admin audit trail.');
      error.status = 400;
      throw error;
    }
    return { certificate: existingCert, alreadyIssued: true };
  }

  // 4. Extract authoritative verified data from registration
  const participantName = registration.student?.fullName || 'Event Participant';
  const gamesParticipated = (registration.selectedGames || []).map(g => g.gameName);

  // 5. Generate collision-resistant unique certificate ID and cryptographic verification token
  let certificate = null;
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    attempts++;
    try {
      const certificateId = Certificate.generateCertificateId();
      const verificationToken = Certificate.generateVerificationToken();

      certificate = new Certificate({
        certificateId,
        registrationId: registration.registrationId,
        eventId: 'vijayadashami-carnival-2026',
        participantName,
        eventName: 'Vijayadashami Carnival',
        eventDate: 'Thursday, 29 October 2026',
        eventVenue: 'SRMU Campus, B5-408',
        gamesParticipated,
        certificateType: 'participation',
        status: 'valid',
        issuedAt: new Date(),
        issuedBy: adminUsername || 'admin',
        verificationToken
      });

      await certificate.save();
      break;
    } catch (err) {
      if (err.code === 11000 && attempts < maxRetries) {
        continue; // Collision retry
      }
      throw err;
    }
  }

  // 6. Update registration document with certificate linkage
  registration.certificateIssued = true;
  registration.certificateId = certificate.certificateId;
  await registration.save();

  return { certificate, alreadyIssued: false };
}

/**
 * Revokes a certificate by its certificateId
 * @param {string} certificateId 
 * @param {string} adminUsername 
 * @param {string} reason 
 */
async function revokeCertificate(certificateId, adminUsername, reason = 'Revoked by authorized administrator') {
  const cert = await Certificate.findOne({ certificateId: certificateId.toUpperCase() });
  if (!cert) {
    const error = new Error(`Certificate not found: ${certificateId}`);
    error.status = 404;
    throw error;
  }

  cert.status = 'revoked';
  cert.revokedAt = new Date();
  cert.revokedBy = adminUsername;
  cert.revocationReason = reason;
  await cert.save();

  // Also update registration certificateIssued flag
  await Registration.updateOne(
    { registrationId: cert.registrationId },
    { $set: { certificateIssued: false } }
  );

  return cert;
}

module.exports = {
  generateQrCodeBuffer,
  buildVerificationUrl,
  generateCertificatePdf,
  issueCertificateForRegistration,
  revokeCertificate
};
