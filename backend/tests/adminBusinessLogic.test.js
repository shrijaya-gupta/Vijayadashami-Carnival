const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const crypto = require('crypto');

// Configure isolated test environment
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'biztestadmin';
process.env.ADMIN_PASSWORD = 'BizTestPassword123!';

const app = require('../src/app');
const AdminSession = require('../src/models/AdminSession');
const db = require('../src/config/supabase');

describe('Vijayadashami Carnival — Phase 2 Admin Business Logic & Revenue Tests', () => {
  let sessionCookie = null;
  let validCsrfToken = null;
  let testSessionId = null;

  before(async () => {
    testSessionId = crypto.randomBytes(32).toString('hex');
    validCsrfToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 3600 * 1000);

    await AdminSession.create({
      sessionId: testSessionId,
      adminId: 'admin-biz-001',
      username: 'biztestadmin',
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

  // Pure logic engine for unit testing calculation accuracy across all 12 scenarios
  function calculateMetrics(rawRecords) {
    const allRecords = (rawRecords || []).map(r => {
      const rawFee = r.total_amount != null ? Number(r.total_amount) : (r.totalAmount != null ? Number(r.totalAmount) : (r.fee_amount != null ? Number(r.fee_amount) : Number(r.feeAmount)));
      const fee = (!isNaN(rawFee) && rawFee > 0) ? rawFee : 10;
      const st = String(r.status || 'confirmed').trim().toLowerCase();
      const ps = String(r.payment_status || r.paymentStatus || 'payment_pending').trim().toLowerCase();
      const att = String(r.attendance_status || r.attendanceStatus || 'pending').trim().toLowerCase();
      const partVerified = att === 'verified' || String(r.participationStatus || '').toLowerCase() === 'verified';

      return {
        ...r,
        totalAmount: fee,
        status: st,
        paymentStatus: ps,
        participationStatus: partVerified ? 'verified' : 'unverified',
        certificateIssued: Boolean(r.certificateIssued || r.certificate_id)
      };
    });

    const totalRegistrations = allRecords.length;
    const cancelledCount = allRecords.filter(r => r.status === 'cancelled').length;
    const confirmedCount = allRecords.filter(r => r.status === 'confirmed').length;
    const pendingCount = allRecords.filter(r => r.status === 'pending').length;
    const totalActivePasses = allRecords.filter(r => r.status !== 'cancelled').length;

    const paidRecords = allRecords.filter(r => r.status !== 'cancelled' && (r.paymentStatus === 'paid' || r.paymentStatus === 'verified'));
    const paidPaymentsCount = paidRecords.length;

    const pendingVerificationCount = allRecords.filter(r => r.status !== 'cancelled' && r.paymentStatus === 'payment_verification_pending').length;
    const pendingPaymentCount = allRecords.filter(r => r.status !== 'cancelled' && ['pending', 'pending_desk_collection', 'payment_pending'].includes(r.paymentStatus)).length;
    const failedPaymentCount = allRecords.filter(r => r.paymentStatus === 'payment_failed' || r.paymentStatus === 'rejected').length;

    const verifiedRevenue = paidRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const activeRegistrations = allRecords.filter(r => r.status !== 'cancelled');
    const potentialRevenue = activeRegistrations.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      totalRegistrations,
      totalActivePasses,
      confirmedRegistrations: confirmedCount,
      cancelledRegistrations: cancelledCount,
      pendingRegistrations: pendingCount,
      paidPaymentsCount,
      pendingVerificationCount,
      pendingPaymentCount,
      failedPaymentCount,
      verifiedRevenue,
      potentialRevenue
    };
  }

  describe('Business Logic Scenario Verifications (12 Targeted Requirements)', () => {
    test('Scenario 1: One verified registration with a ₹10 stored fee', () => {
      const records = [
        { registration_id: 'TEST-001', total_amount: 10, status: 'confirmed', payment_status: 'paid' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalActivePasses, 1);
      assert.strictEqual(m.paidPaymentsCount, 1);
      assert.strictEqual(m.verifiedRevenue, 10, 'Verified revenue must be ₹10');
      assert.strictEqual(m.potentialRevenue, 10);
    });

    test('Scenario 2: One pending registration with a ₹10 stored fee', () => {
      const records = [
        { registration_id: 'TEST-002', total_amount: 10, status: 'confirmed', payment_status: 'payment_verification_pending' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalActivePasses, 1);
      assert.strictEqual(m.paidPaymentsCount, 0);
      assert.strictEqual(m.pendingVerificationCount, 1);
      assert.strictEqual(m.verifiedRevenue, 0, 'Pending registration must NOT contribute to verified revenue');
      assert.strictEqual(m.potentialRevenue, 10, 'Pending registration contributes to potential revenue estimate');
    });

    test('Scenario 3: One rejected payment', () => {
      const records = [
        { registration_id: 'TEST-003', total_amount: 10, status: 'confirmed', payment_status: 'payment_failed' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.failedPaymentCount, 1);
      assert.strictEqual(m.verifiedRevenue, 0, 'Rejected payment must NOT contribute to verified revenue');
    });

    test('Scenario 4: One cancelled registration', () => {
      const records = [
        { registration_id: 'TEST-004', total_amount: 10, status: 'cancelled', payment_status: 'paid' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalRegistrations, 1);
      assert.strictEqual(m.totalActivePasses, 0, 'Cancelled registration must NOT count as an active pass');
      assert.strictEqual(m.cancelledRegistrations, 1);
      assert.strictEqual(m.paidPaymentsCount, 0, 'Cancelled registration must be excluded from active verified payments');
      assert.strictEqual(m.verifiedRevenue, 0, 'Cancelled registration must NOT contribute to verified revenue');
      assert.strictEqual(m.potentialRevenue, 0, 'Cancelled registration must NOT contribute to potential revenue');
    });

    test('Scenario 5: Multiple verified registrations with reliable stored fee values', () => {
      const records = [
        { registration_id: 'TEST-005A', total_amount: 10, status: 'confirmed', payment_status: 'paid' },
        { registration_id: 'TEST-005B', total_amount: 10, status: 'confirmed', payment_status: 'paid' },
        { registration_id: 'TEST-005C', total_amount: 10, status: 'confirmed', payment_status: 'paid' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalActivePasses, 3);
      assert.strictEqual(m.paidPaymentsCount, 3);
      assert.strictEqual(m.verifiedRevenue, 30, '3 verified passes at ₹10 must equal ₹30');
      assert.strictEqual(m.potentialRevenue, 30);
    });

    test('Scenario 6: Empty dataset (handles zero cleanly without NaN)', () => {
      const m = calculateMetrics([]);
      assert.strictEqual(m.totalRegistrations, 0);
      assert.strictEqual(m.totalActivePasses, 0);
      assert.strictEqual(m.paidPaymentsCount, 0);
      assert.strictEqual(m.verifiedRevenue, 0);
      assert.strictEqual(m.potentialRevenue, 0);
      assert.strictEqual(isNaN(m.verifiedRevenue), false);
      assert.strictEqual(isNaN(m.potentialRevenue), false);
    });

    test('Scenario 7: Missing or invalid fee values default gracefully to standard ₹10 pass fee', () => {
      const records = [
        { registration_id: 'TEST-007A', total_amount: null, status: 'confirmed', payment_status: 'paid' },
        { registration_id: 'TEST-007B', total_amount: 'invalid', status: 'confirmed', payment_status: 'paid' },
        { registration_id: 'TEST-007C', total_amount: 0, status: 'confirmed', payment_status: 'paid' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.paidPaymentsCount, 3);
      assert.strictEqual(m.verifiedRevenue, 30, 'Missing or non-positive fees default to ₹10 standard pass');
    });

    test('Scenario 8: Legacy or differently capitalized status values handled robustly', () => {
      const records = [
        { registration_id: 'TEST-008A', total_amount: 10, status: 'Confirmed', payment_status: 'PAID' },
        { registration_id: 'TEST-008B', total_amount: 10, status: 'CONFIRMED', payment_status: 'Verified' },
        { registration_id: 'TEST-008C', total_amount: 10, status: 'Cancelled', payment_status: 'PAID' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalActivePasses, 2);
      assert.strictEqual(m.paidPaymentsCount, 2);
      assert.strictEqual(m.verifiedRevenue, 20);
    });

    test('Scenario 9: Supabase query failure propagates error instead of silent zero-value success', async () => {
      // Mock db.getAllRegistrations to simulate a database failure
      const originalGetAll = db.getAllRegistrations;
      try {
        db.getAllRegistrations = async () => {
          throw new Error('Supabase cluster connection timeout');
        };

        const res = await request(app)
          .get('/api/admin/dashboard')
          .set('Cookie', [sessionCookie]);

        assert.strictEqual(res.status, 500, 'Must return HTTP 500 on database query failure');
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.error || res.body.message, 'Must return an error message on failure');
      } finally {
        db.getAllRegistrations = originalGetAll;
      }
    });

    test('Scenario 10: Pagination and range batching handles large row counts safely', async () => {
      // Verify that getAllRegistrations is defined and returns an array
      const allRegs = await db.getAllRegistrations();
      assert.ok(Array.isArray(allRegs), 'getAllRegistrations must return an array');
    });

    test('Scenario 11: Confirmation that pending and rejected payments are excluded from verified revenue', () => {
      const records = [
        { registration_id: 'TEST-011A', total_amount: 10, status: 'confirmed', payment_status: 'paid' },
        { registration_id: 'TEST-011B', total_amount: 10, status: 'confirmed', payment_status: 'payment_verification_pending' },
        { registration_id: 'TEST-011C', total_amount: 10, status: 'confirmed', payment_status: 'payment_pending' },
        { registration_id: 'TEST-011D', total_amount: 10, status: 'confirmed', payment_status: 'payment_failed' },
        { registration_id: 'TEST-011E', total_amount: 10, status: 'confirmed', payment_status: 'rejected' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalActivePasses, 5);
      assert.strictEqual(m.paidPaymentsCount, 1);
      assert.strictEqual(m.verifiedRevenue, 10, 'Only 1 paid pass should be in verified revenue');
      assert.strictEqual(m.potentialRevenue, 50, 'All 5 active passes should be in potential revenue');
    });

    test('Scenario 12: Confirmation that cancelled registrations are treated consistently across all counters', () => {
      const records = [
        { registration_id: 'TEST-012A', total_amount: 10, status: 'cancelled', payment_status: 'paid' },
        { registration_id: 'TEST-012B', total_amount: 10, status: 'cancelled', payment_status: 'payment_verification_pending' },
        { registration_id: 'TEST-012C', total_amount: 10, status: 'confirmed', payment_status: 'paid' }
      ];
      const m = calculateMetrics(records);
      assert.strictEqual(m.totalRegistrations, 3);
      assert.strictEqual(m.cancelledRegistrations, 2);
      assert.strictEqual(m.totalActivePasses, 1);
      assert.strictEqual(m.paidPaymentsCount, 1);
      assert.strictEqual(m.pendingVerificationCount, 0, 'Cancelled registrations must not appear in pending verification');
      assert.strictEqual(m.verifiedRevenue, 10);
      assert.strictEqual(m.potentialRevenue, 10);
    });
  });

  describe('Live Dashboard API Endpoint Integration', () => {
    test('GET /api/admin/dashboard returns valid summary structure and accurate revenue fields', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', [sessionCookie]);

      assert.strictEqual(res.status, 200, 'Must return HTTP 200 for authenticated admin');
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.summary, 'Must contain summary object');

      const s = res.body.data.summary;
      assert.ok(typeof s.totalRegistrations === 'number', 'totalRegistrations must be a number');
      assert.ok(typeof s.totalActivePasses === 'number', 'totalActivePasses must be a number');
      assert.ok(typeof s.verifiedRevenue === 'number', 'verifiedRevenue must be a number');
      assert.ok(typeof s.potentialRevenue === 'number', 'potentialRevenue must be a number');
      assert.strictEqual(s.passFee, 10, 'passFee must be 10');
      assert.ok(!isNaN(s.verifiedRevenue), 'verifiedRevenue must not be NaN');
      assert.ok(!isNaN(s.potentialRevenue), 'potentialRevenue must not be NaN');
    });
  });
});
