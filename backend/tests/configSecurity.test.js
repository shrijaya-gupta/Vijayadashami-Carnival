const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const crypto = require('crypto');

// Set test environment configuration
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'securitytestadmin';
process.env.ADMIN_PASSWORD = 'SecurityTestPass123!';

const app = require('../src/app');
const AdminSession = require('../src/models/AdminSession');
const AdminUser = require('../src/models/AdminUser');
const db = require('../src/config/supabase');

describe('Vijayadashami Carnival — Phase 1 Config & Scoreboard Security Hardening', () => {
  let sessionCookie = null;
  let validCsrfToken = null;
  let testSessionId = null;

  before(async () => {
    // Create an authenticated session directly in the active session store
    testSessionId = crypto.randomBytes(32).toString('hex');
    validCsrfToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 3600 * 1000);

    await AdminSession.create({
      sessionId: testSessionId,
      adminId: 'admin-sec-001',
      username: 'securitytestadmin',
      csrfToken: validCsrfToken,
      expiresAt: expiresAt
    });

    sessionCookie = `srmu_admin_session=${testSessionId}`;
  });

  after(async () => {
    if (testSessionId) {
      await AdminSession.deleteOne({ sessionId: testSessionId });
    }
  });

  describe('1. Unauthenticated Mutation Rejections (Must return 401)', () => {
    test('POST /api/config/payment-qr is rejected when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/config/payment-qr')
        .send({
          upi_id: 'malicious@upi',
          upi_name: 'Attacker Account'
        });

      assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /authentication required/i);
    });

    test('POST /api/config/scoreboard is rejected when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/config/scoreboard')
        .send({
          game_id: 'archery',
          participant_name: 'Unauthorized Participant',
          score: 100
        });

      assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /authentication required/i);
    });

    test('DELETE /api/config/scoreboard/:id is rejected when unauthenticated', async () => {
      const res = await request(app)
        .delete('/api/config/scoreboard/fake-score-id-999');

      assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /authentication required/i);
    });
  });

  describe('2. CSRF Token Enforcement (Must return 403 on missing or invalid CSRF)', () => {
    test('POST /api/config/payment-qr is rejected when authenticated but missing CSRF token', async () => {
      const res = await request(app)
        .post('/api/config/payment-qr')
        .set('Cookie', [sessionCookie])
        .send({
          upi_id: 'tampered@upi',
          upi_name: 'Tampered Account'
        });

      assert.strictEqual(res.status, 403, 'Should return HTTP 403 Forbidden for missing CSRF');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /csrf/i);
    });

    test('POST /api/config/scoreboard is rejected when authenticated with wrong CSRF token', async () => {
      const res = await request(app)
        .post('/api/config/scoreboard')
        .set('Cookie', [sessionCookie])
        .set('X-CSRF-Token', 'invalid-csrf-token-12345')
        .send({
          game_id: 'archery',
          participant_name: 'Attacker Player',
          score: 99
        });

      assert.strictEqual(res.status, 403, 'Should return HTTP 403 Forbidden for invalid CSRF');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /csrf/i);
    });

    test('DELETE /api/config/scoreboard/:id is rejected when authenticated with wrong CSRF token', async () => {
      const res = await request(app)
        .delete('/api/config/scoreboard/fake-score-id-999')
        .set('Cookie', [sessionCookie])
        .set('X-CSRF-Token', 'invalid-csrf-token-12345');

      assert.strictEqual(res.status, 403, 'Should return HTTP 403 Forbidden for invalid CSRF');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /csrf/i);
    });
  });

  describe('3. Authenticated Requests with Valid CSRF Token Follow API Contract', () => {
    test('POST /api/config/scoreboard validates payload when authenticated with valid CSRF', async () => {
      // Missing mandatory fields should trigger the controller validator (400)
      // proving that authentication and CSRF middleware passed through to the controller
      const res = await request(app)
        .post('/api/config/scoreboard')
        .set('Cookie', [sessionCookie])
        .set('X-CSRF-Token', validCsrfToken)
        .send({
          // Missing game_id, participant_name, score
        });

      assert.strictEqual(res.status, 400, 'Should reach controller validator and return HTTP 400 for missing fields');
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /missing required score fields/i);
    });
  });

  describe('4. Public Read-Only GET Endpoints Remain Fully Accessible (No Auth Required)', () => {
    test('GET /api/config returns authoritative config without credentials', async () => {
      const res = await request(app)
        .get('/api/config');

      assert.strictEqual(res.status, 200, 'Public config should return HTTP 200');
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data, 'Should contain config data object');
    });

    test('GET /api/config/payment-qr returns QR info without credentials', async () => {
      const res = await request(app)
        .get('/api/config/payment-qr');

      assert.strictEqual(res.status, 200, 'Public payment QR should return HTTP 200');
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.upi_id, 'Should contain upi_id for student payment');
    });

    test('GET /api/config/scoreboard returns live leaderboard without credentials', async () => {
      const res = await request(app)
        .get('/api/config/scoreboard');

      assert.strictEqual(res.status, 200, 'Public scoreboard should return HTTP 200');
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data), 'Data should be an array of scores');
    });
  });

  describe('5. Admin Authentication Flow Integrity (Login, Me, Logout)', () => {
    test('POST /api/admin/login authenticates with valid credentials and sets session & CSRF', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD
        });

      assert.strictEqual(res.status, 200, 'Login should succeed with HTTP 200');
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.csrfToken, 'Response must include csrfToken');

      // Check cookies
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies, 'Response must set cookies');
      const hasSessionCookie = cookies.some(c => c.includes('srmu_admin_session='));
      assert.ok(hasSessionCookie, 'Must set srmu_admin_session cookie');

      // Test GET /api/admin/me with this new session
      const newSessionCookie = cookies.find(c => c.includes('srmu_admin_session=')).split(';')[0];
      const meRes = await request(app)
        .get('/api/admin/me')
        .set('Cookie', [newSessionCookie]);

      assert.strictEqual(meRes.status, 200, 'GET /api/admin/me should return 200');
      assert.strictEqual(meRes.body.authenticated, true);
      assert.strictEqual(meRes.body.csrfToken, res.body.csrfToken);

      // Test POST /api/admin/logout with this session and CSRF
      const logoutRes = await request(app)
        .post('/api/admin/logout')
        .set('Cookie', [newSessionCookie])
        .set('X-CSRF-Token', res.body.csrfToken);

      assert.strictEqual(logoutRes.status, 200, 'Logout should succeed with HTTP 200');
      assert.strictEqual(logoutRes.body.success, true);
    });
  });
});
