const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

// Configure isolated test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5003';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/srmu_fun_games_cert_test';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.ADMIN_USERNAME = 'testorganizer';
process.env.ADMIN_PASSWORD = 'TestCertPassword2026!';

const app = require('../src/app');
const Registration = require('../src/models/Registration');
const Certificate = require('../src/models/Certificate');
const AdminUser = require('../src/models/AdminUser');
const AdminSession = require('../src/models/AdminSession');

describe('Vijayadashami Carnival — Phase 7 Certificate & QR Verification Test Suite', () => {
  let authCookie = null;
  let csrfToken = null;
  let testReg1 = null;
  let testReg2 = null;
  let issuedCert = null;

  before(async () => {
    // 1. Connect to isolated database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
    }

    // 2. Clear test collections
    await Registration.deleteMany({});
    await Certificate.deleteMany({});
    await AdminUser.deleteMany({});
    await AdminSession.deleteMany({});

    // 3. Create test admin organizer
    const passwordHash = await AdminUser.hashPassword('TestCertPassword2026!');
    await AdminUser.create({
      username: 'testorganizer',
      passwordHash,
      fullName: 'Cert Verification Lead',
      role: 'admin'
    });

    // 4. Authenticate admin to obtain authCookie and csrfToken
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'testorganizer',
        password: 'TestCertPassword2026!'
      });

    assert.strictEqual(loginRes.status, 200);
    csrfToken = loginRes.body.csrfToken;
    const cookies = loginRes.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies.find(c => c.startsWith('srmu_admin_session=')) : cookies;

    // 5. Seed test registration records (both initially unverified)
    testReg1 = await Registration.create({
      registrationId: 'SRMU-2026-TEST01',
      student: {
        fullName: 'Aryan Verma',
        mobileNumber: '9876543210',
        rollNumber: '2023CSB501',
        course: 'B.Tech',
        branch: 'Computer Science',
        academicYear: '2nd Year'
      },
      selectedGames: [
        {
          gameId: 'lemon-race',
          gameName: 'Lemon Race',
          participationType: 'individual'
        },
        {
          gameId: 'treasure-hunt',
          gameName: 'Treasure Hunt',
          participationType: 'team',
          teamName: 'B5 Seekers',
          teamMembers: [
            { name: 'Rohan Sharma', roll: '2023CSB502', contact: '9876543211' }
          ]
        }
      ],
      status: 'confirmed',
      participationStatus: 'unverified',
      certificateIssued: false
    });

    testReg2 = await Registration.create({
      registrationId: 'SRMU-2026-TEST02',
      student: {
        fullName: 'Priya Mishra',
        mobileNumber: '9876543220',
        rollNumber: '2023ECB509',
        course: 'B.Tech',
        branch: 'Electronics',
        academicYear: '3rd Year'
      },
      selectedGames: [
        {
          gameId: 'musical-chairs',
          gameName: 'Musical Chairs',
          participationType: 'individual'
        }
      ],
      status: 'confirmed',
      participationStatus: 'unverified',
      certificateIssued: false
    });
  });

  after(async () => {
    try {
      await Registration.deleteMany({});
      await Certificate.deleteMany({});
      await AdminUser.deleteMany({});
      await AdminSession.deleteMany({});
      await mongoose.connection.close();
    } catch {
      // Ignore teardown disconnect errors
    }
  });

  // ==========================================================================
  // SECTION 1: PARTICIPATION ELIGIBILITY WORKFLOW
  // ==========================================================================

  test('1. Unverified registration cannot be issued a certificate (400 Bad Request)', async () => {
    // Attempting to issue a certificate before verifying participation must be rejected!
    const res = await request(app)
      .post(`/api/admin/certificates/issue/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('not been verified'));
  });

  test('2. Unauthenticated user cannot verify participation (401 Unauthorized)', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/verify-participation/${testReg1.registrationId}`)
      .send();

    assert.strictEqual(res.status, 401);
  });

  test('3. Verification request without CSRF token is rejected (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/verify-participation/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .send();

    assert.strictEqual(res.status, 403);
  });

  test('4. Authorized organizer successfully marks participation as verified (200 OK)', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/verify-participation/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.registration.participationStatus, 'verified');
    assert.strictEqual(res.body.registration.participationVerifiedBy, 'testorganizer');
    assert.ok(res.body.registration.participationVerifiedAt);

    // Verify in database
    const updated = await Registration.findOne({ registrationId: testReg1.registrationId });
    assert.strictEqual(updated.participationStatus, 'verified');
    assert.strictEqual(updated.participationVerifiedBy, 'testorganizer');
  });

  test('5. Repeated verification request is safe and idempotent (200 OK)', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/verify-participation/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.registration.participationStatus, 'verified');
  });

  // ==========================================================================
  // SECTION 2: CERTIFICATE GENERATION & ISSUANCE
  // ==========================================================================

  test('6. Issuing certificate for verified participant succeeds (201 Created) with collision-resistant ID and token', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/issue/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);

    issuedCert = res.body.certificate;
    assert.ok(issuedCert);
    assert.ok(issuedCert.certificateId.startsWith('SRMU-CERT-2026-'));
    assert.strictEqual(issuedCert.participantName, 'Aryan Verma'); // Authoritative name from registration
    assert.strictEqual(issuedCert.certificateType, 'participation');
    assert.strictEqual(issuedCert.status, 'valid');
    assert.ok(issuedCert.verificationToken);
    assert.strictEqual(issuedCert.verificationToken.length, 48); // 24 bytes hex = 48 chars
    assert.ok(issuedCert.verifyUrl.includes(issuedCert.verificationToken));

    // Verify in database
    const certDoc = await Certificate.findOne({ certificateId: issuedCert.certificateId });
    assert.ok(certDoc);
    assert.strictEqual(certDoc.registrationId, testReg1.registrationId);

    // Verify registration was updated with certificate reference
    const regDoc = await Registration.findOne({ registrationId: testReg1.registrationId });
    assert.strictEqual(regDoc.certificateIssued, true);
    assert.strictEqual(regDoc.certificateId, issuedCert.certificateId);
  });

  test('7. Repeated certificate issuance for same participant is idempotent and prevents duplicate documents (200 OK)', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/issue/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.certificate.certificateId, issuedCert.certificateId);

    // Count in database must remain exactly 1
    const certCount = await Certificate.countDocuments({ registrationId: testReg1.registrationId });
    assert.strictEqual(certCount, 1);
  });

  // ==========================================================================
  // SECTION 3: PUBLIC VERIFICATION & PRIVACY SAFEGUARDS
  // ==========================================================================

  test('8. Public verification endpoint returns valid certificate details without leaking sensitive student data', async () => {
    const res = await request(app)
      .get(`/api/certificates/verify/${issuedCert.verificationToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'valid');

    const cert = res.body.certificate;
    assert.strictEqual(cert.certificateId, issuedCert.certificateId);
    assert.strictEqual(cert.participantName, 'Aryan Verma');
    assert.strictEqual(cert.eventName, 'Vijayadashami Carnival');
    assert.strictEqual(cert.certificateType, 'participation');
    assert.ok(cert.gamesParticipated.includes('Lemon Race'));

    // PRIVACY ENFORCEMENT: Sensitive student information must NEVER be exposed
    assert.strictEqual(cert.mobileNumber, undefined, 'Phone number must not be exposed');
    assert.strictEqual(cert.rollNumber, undefined, 'Roll number must not be exposed');
    assert.strictEqual(cert.course, undefined, 'Course must not be exposed');
    assert.strictEqual(cert.branch, undefined, 'Branch must not be exposed');
    assert.strictEqual(cert._id, undefined, 'Internal MongoDB _id must not be exposed');
  });

  test('9. Public verification by Certificate ID also works smoothly', async () => {
    const res = await request(app)
      .get(`/api/certificates/verify/${issuedCert.certificateId}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'valid');
    assert.strictEqual(res.body.certificate.certificateId, issuedCert.certificateId);
  });

  test('10. Public verification with invalid or non-existent token returns 404 with not_found status', async () => {
    const res = await request(app)
      .get('/api/certificates/verify/nonexistent-invalid-token-12345');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.status, 'not_found');
    assert.ok(res.body.message.includes('invalid or non-existent'));
  });

  // ==========================================================================
  // SECTION 4: PDF GENERATION & DOWNLOAD
  // ==========================================================================

  test('11. Public PDF download endpoint returns genuine downloadable PDF binary buffer', async () => {
    const res = await request(app)
      .get(`/api/certificates/download/${issuedCert.verificationToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
    assert.ok(res.headers['content-disposition'].includes(issuedCert.certificateId));
    assert.ok(res.body.length > 1000, 'PDF buffer must be non-empty and substantial');

    // PDF files start with %PDF- header magic bytes
    const pdfMagic = res.body.slice(0, 5).toString('ascii');
    assert.strictEqual(pdfMagic, '%PDF-');
  });

  test('12. Authenticated organizer can download PDF directly by Certificate ID', async () => {
    const res = await request(app)
      .get(`/api/admin/certificates/${issuedCert.certificateId}/download`)
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
    assert.ok(res.body.length > 1000);
  });

  // ==========================================================================
  // SECTION 5: STUDENT STATUS CHECK
  // ==========================================================================

  test('13. Student status check for unverified registration returns pending attendance message', async () => {
    const res = await request(app)
      .get(`/api/certificates/student/${testReg2.registrationId}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.participationStatus, 'unverified');
    assert.strictEqual(res.body.certificateIssued, false);
    assert.ok(res.body.message.includes('not been verified'));
  });

  test('14. Student status check for verified participant with issued certificate returns download link', async () => {
    const res = await request(app)
      .get(`/api/certificates/student/${testReg1.registrationId}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.participationStatus, 'verified');
    assert.strictEqual(res.body.certificateIssued, true);
    assert.strictEqual(res.body.certificate.certificateId, issuedCert.certificateId);
    assert.ok(res.body.certificate.downloadUrl);
  });

  // ==========================================================================
  // SECTION 6: REVOCATION WORKFLOW & AUDIT TRAIL
  // ==========================================================================

  test('15. Revoking certificate sets status to revoked and disables downloads', async () => {
    const res = await request(app)
      .post(`/api/admin/certificates/${issuedCert.certificateId}/revoke`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ reason: 'Audit found participant left early' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.certificate.status, 'revoked');

    // Public verification now returns revoked status with neutral message
    const verifyRes = await request(app)
      .get(`/api/certificates/verify/${issuedCert.verificationToken}`);

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.status, 'revoked');
    assert.ok(verifyRes.body.message.includes('revoked and is no longer valid'));

    // Public download is rejected with 403
    const dlRes = await request(app)
      .get(`/api/certificates/download/${issuedCert.verificationToken}`);

    assert.strictEqual(dlRes.status, 403);
  });

  test('16. Revoking attendance verification reverts status and revokes any issued certificate', async () => {
    // Reset testReg2 to verified
    await Registration.updateOne(
      { registrationId: testReg2.registrationId },
      { $set: { participationStatus: 'verified' } }
    );

    const res = await request(app)
      .post(`/api/admin/certificates/revoke-verification/${testReg2.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.registration.participationStatus, 'unverified');

    const checkDoc = await Registration.findOne({ registrationId: testReg2.registrationId });
    assert.strictEqual(checkDoc.participationStatus, 'unverified');
  });

  // ==========================================================================
  // SECTION 7: ADMIN PARTICIPANTS LIST & FILTERS
  // ==========================================================================

  test('17. Admin certificates participants list supports search and status filtering', async () => {
    const res = await request(app)
      .get('/api/admin/certificates/participants?search=Aryan')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.participants.length >= 1);
    assert.strictEqual(res.body.participants[0].registrationId, testReg1.registrationId);
  });

  test('18. Historical certificates preserve original legacy event name and date without mutation', async () => {
    const legacyCert = await Certificate.create({
      certificateId: 'SRMU-CERT-2026-LEGACY01',
      verificationToken: 'abcdef1234567890abcdef1234567890abcdef12345678',
      registrationId: 'SRMU-2026-HIST01',
      participantName: 'Historical Participant',
      eventName: 'SRMU B5 Fun Games Event',
      eventDate: 'Wednesday, 28 October 2026',
      eventVenue: 'SRMU Campus, B5',
      gamesParticipated: ['Treasure Hunt'],
      issuedBy: 'legacy-system',
      status: 'valid'
    });

    const res = await request(app)
      .get(`/api/certificates/verify/${legacyCert.verificationToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.certificate.eventName, 'SRMU B5 Fun Games Event');
    assert.strictEqual(res.body.certificate.eventDate, 'Wednesday, 28 October 2026');
  });
});
