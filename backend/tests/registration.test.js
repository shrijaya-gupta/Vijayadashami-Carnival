const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

// Configure test environment before importing app
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/srmu_fun_games_test';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

const app = require('../src/app');
const Registration = require('../src/models/Registration');

describe('Vijayadashami Carnival — Backend API Test Suite', () => {
  before(async () => {
    // Connect to isolated test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
    }
    // Clean test collection
    await Registration.deleteMany({});
  });

  after(async () => {
    // Clean and disconnect
    try {
      await Registration.deleteMany({});
      await mongoose.connection.close();
    } catch {
      // Ignore disconnect errors in tear down
    }
  });

  // 1. Health Endpoint Test
  test('1. GET /api/health returns 200, status healthy and database connected', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.database, 'connected');
    assert.ok(res.body.timestamp);
    // Ensure no internal credentials leaked
    assert.strictEqual(res.body.MONGODB_URI, undefined);
    assert.strictEqual(res.body.env, undefined);
  });

  // 2. Games Catalogue Endpoint Test
  test('2. GET /api/games returns the authoritative six-game catalogue with provisional rules', async () => {
    const res = await request(app).get('/api/games');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.total, 6);
    assert.strictEqual(res.body.games.length, 6);

    const ids = res.body.games.map(g => g.id);
    assert.deepStrictEqual(ids.sort(), [
      'balloon-dual-race',
      'cup-balloon-pyramid',
      'human-knot',
      'lemon-race',
      'musical-chairs',
      'target-shooting'
    ].sort());

    const targetShooting = res.body.games.find(g => g.id === 'target-shooting');
    assert.ok(targetShooting, 'Target Shooting must be present in active catalogue');
    assert.strictEqual(targetShooting.name, 'Target Shooting');
    assert.ok(targetShooting.safetyNotice, 'Target Shooting must have a safety notice');

    res.body.games.forEach(game => {
      assert.ok(game.name);
      assert.ok(game.description);
      assert.strictEqual(game.rulesApprovalStatus, 'Pending Organizer Approval');
    });
  });

  // 3. Missing Required Fields Validation
  test('3. POST /api/registrations rejects missing student required fields with 400', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'A', // too short
          mobileNumber: '',
          rollNumber: ''
        },
        selectedGames: [{ gameId: 'lemon-race', participationType: 'individual' }]
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.some(e => e.includes('full name')));
    assert.ok(res.body.errors.some(e => e.includes('mobile number')));
  });

  // 4. Invalid Mobile Number Test
  test('4. POST /api/registrations rejects invalid Indian mobile numbers with 400', async () => {
    const invalidNumbers = ['1234567890', '5555555555', '98765', 'abcdefghij'];

    for (const mobile of invalidNumbers) {
      const res = await request(app)
        .post('/api/registrations')
        .send({
          student: {
            fullName: 'Aarav Sharma',
            mobileNumber: mobile,
            rollNumber: '2024BCSE101',
            course: 'B.Tech',
            branch: 'Computer Science & Engineering',
            academicYear: '2nd Year'
          },
          selectedGames: [{ gameId: 'lemon-race', participationType: 'individual' }]
        });

      assert.strictEqual(res.status, 400, `Expected 400 for mobile: ${mobile}`);
      assert.ok(res.body.errors.some(e => e.includes('Indian mobile number')));
    }
  });

  // 5. Empty Selected Games Test
  test('5. POST /api/registrations rejects empty selectedGames array with 400', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Aarav Sharma',
          mobileNumber: '9876543210',
          rollNumber: '2024BCSE101',
          course: 'B.Tech',
          branch: 'Computer Science & Engineering',
          academicYear: '2nd Year'
        },
        selectedGames: []
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some(e => e.includes('At least one game')));
  });

  // 6. Invalid Game ID Test
  test('6. POST /api/registrations rejects invalid game ID not in catalogue with 400', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Aarav Sharma',
          mobileNumber: '9876543210',
          rollNumber: '2024BCSE101',
          course: 'B.Tech',
          branch: 'Computer Science & Engineering',
          academicYear: '2nd Year'
        },
        selectedGames: [{ gameId: 'unauthorized-game-xyz', participationType: 'individual' }]
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some(e => e.includes('not part of the official event catalogue')));

    // Confirm that legacy game Treasure Hunt is rejected for new registrations
    const legacyRes = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Aarav Sharma',
          mobileNumber: '9876543210',
          rollNumber: '2024BCSE101',
          course: 'B.Tech',
          branch: 'Computer Science & Engineering',
          academicYear: '2nd Year'
        },
        selectedGames: [{ gameId: 'treasure-hunt', participationType: 'individual' }]
      });

    assert.strictEqual(legacyRes.status, 400);
    assert.ok(legacyRes.body.errors.some(e => e.includes('not part of the official event catalogue')));
  });

  // 7. Invalid Participation Type Test
  test('7. POST /api/registrations rejects invalid participation type with 400', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Aarav Sharma',
          mobileNumber: '9876543210',
          rollNumber: '2024BCSE101',
          course: 'B.Tech',
          branch: 'Computer Science & Engineering',
          academicYear: '2nd Year'
        },
        selectedGames: [{ gameId: 'lemon-race', participationType: 'spectator' }]
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some(e => e.includes('individual') || e.includes('team')));
  });

  // 8. Missing Team Name Validation for Team Format
  test('8. POST /api/registrations rejects missing team name when format is team with 400', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Aarav Sharma',
          mobileNumber: '9876543210',
          rollNumber: '2024BCSE101',
          course: 'B.Tech',
          branch: 'Computer Science & Engineering',
          academicYear: '2nd Year'
        },
        selectedGames: [{ gameId: 'target-shooting', participationType: 'team', teamName: '   ' }]
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some(e => e.includes('Team name is required')));
  });

  // 9. Successful Registration Creation & Unique ID Generation
  test('9. POST /api/registrations successfully creates registration and returns 201 with unique ID', async () => {
    const payload = {
      student: {
        fullName: 'Priya Verma',
        mobileNumber: '+919876543211',
        rollNumber: '2024BIT202',
        course: 'B.Tech',
        branch: 'Information Technology',
        academicYear: '1st Year'
      },
      selectedGames: [
        { gameId: 'lemon-race', participationType: 'individual' },
        { gameId: 'musical-chairs', participationType: 'individual' }
      ]
    };

    const res = await request(app)
      .post('/api/registrations')
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Registration submitted successfully.');
    assert.ok(res.body.data);

    // Verify server-generated ID format
    assert.match(res.body.data.registrationId, /^SRMU-2026-[2-9A-Z]{6}$/);
    assert.strictEqual(res.body.data.student.fullName, 'Priya Verma');
    assert.strictEqual(res.body.data.student.rollNumber, '2024BIT202');
    assert.strictEqual(res.body.data.selectedGames.length, 2);

    // Verify record actually exists in MongoDB
    const saved = await Registration.findOne({ registrationId: res.body.data.registrationId });
    assert.ok(saved);
    assert.strictEqual(saved.student.rollNumber, '2024BIT202');
    assert.strictEqual(saved.student.mobileNumber, '+919876543211');
  });

  // 10. Successful Team Registration with Dynamic Members
  test('10. POST /api/registrations successfully persists team registration with member roster', async () => {
    const payload = {
      student: {
        fullName: 'Rohan Gupta',
        mobileNumber: '09812345678',
        rollNumber: '2024BME303',
        course: 'B.Tech',
        branch: 'Mechanical Engineering',
        academicYear: '3rd Year'
      },
      selectedGames: [
        {
          gameId: 'target-shooting',
          participationType: 'team',
          teamName: 'Cyber Trackers',
          teamMembers: [
            { name: 'Kavita Singh', roll: '2024BME304', contact: '9812345679' },
            { name: 'Sameer Khan', roll: '2024BME305' }
          ]
        }
      ]
    };

    const res = await request(app)
      .post('/api/registrations')
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.selectedGames[0].teamName, 'Cyber Trackers');
    assert.strictEqual(res.body.data.selectedGames[0].teamMembersCount, 3); // 1 leader + 2 members
  });

  // 11. Idempotency & Network Retry Handling
  test('11. Repeated POST with same Idempotency-Key returns 200 without creating duplicate document', async () => {
    const idempotencyKey = 'retry-test-' + Date.now();
    const payload = {
      idempotencyKey,
      student: {
        fullName: 'Neha Mishra',
        mobileNumber: '9988776655',
        rollNumber: '2024BCA105',
        course: 'BCA',
        branch: 'Computer Applications',
        academicYear: '2nd Year'
      },
      selectedGames: [{ gameId: 'human-knot', participationType: 'individual' }]
    };

    // First attempt -> 201 Created
    const res1 = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    assert.strictEqual(res1.status, 201);
    const regId = res1.body.data.registrationId;

    // Second attempt with same key (simulated network retry) -> 200 OK
    const res2 = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.data.registrationId, regId);
    assert.strictEqual(res2.body.isDuplicateRetry, true);

    // Confirm only one document exists in database
    const count = await Registration.countDocuments({ idempotencyKey });
    assert.strictEqual(count, 1);
  });

  // 12. Safe Minimal Confirmation Lookup Test
  test('12. GET /api/registrations/:registrationId returns safe minimal info without leaking mobile numbers', async () => {
    const doc = await Registration.findOne({});
    assert.ok(doc);

    const res = await request(app).get(`/api/registrations/${doc.registrationId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.registrationId, doc.registrationId);
    assert.strictEqual(res.body.data.student.fullName, doc.student.fullName);

    // Ensure private phone number is NOT exposed in public echo
    assert.strictEqual(res.body.data.student.mobileNumber, undefined);
  });

  // 13. Non-existent ID returns 404
  test('13. GET /api/registrations/:registrationId returns 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/registrations/SRMU-2026-NONEXIST');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('No registration found'));
  });

  // 14. Error Responses Do Not Leak Stack Traces
  test('14. Malformed JSON returns 400 without leaking stack traces or internal paths', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Content-Type', 'application/json')
      .send('{ invalid json payload');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Malformed JSON'));
    assert.strictEqual(res.body.stack, undefined);
  });

  // 14b. Registration Fee Calculation & Payment Status Truth
  test('14b. Server accurately calculates dynamic fee ₹5 per selected game for 1 to 6 games', async () => {
    // 1 game = ₹5
    const res1 = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Test Fee One',
          mobileNumber: '9876543211',
          rollNumber: '2024FEE001',
          course: 'B.Tech',
          branch: 'CSE',
          academicYear: '1st Year'
        },
        selectedGames: [{ gameId: 'lemon-race', participationType: 'individual' }],
        // Client attempts to tamper fee
        feeAmount: 0,
        paymentStatus: 'paid'
      });

    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res1.body.data.fee.totalAmount, 5);
    assert.strictEqual(res1.body.data.fee.feePerGame, 5);
    assert.strictEqual(res1.body.data.fee.currency, 'INR');
    assert.strictEqual(res1.body.data.fee.selectedGamesCount, 1);
    // Server ignores client-submitted paymentStatus: 'paid' without verification
    assert.strictEqual(res1.body.data.fee.paymentStatus, 'payment_pending');
    assert.strictEqual(res1.body.data.fee.paymentStatusLabel, 'Payment Pending');

    // Test submitting payment reference / UTR for online verification
    const refRes = await request(app)
      .post(`/api/registrations/${res1.body.data.registrationId}/payment-reference`)
      .send({ paymentReference: 'UPI/20261026/8947219842' });
    assert.strictEqual(refRes.status, 200);
    assert.strictEqual(refRes.body.data.fee.paymentStatus, 'payment_verification_pending');
    assert.strictEqual(refRes.body.data.fee.paymentStatusLabel, 'Payment Verification Pending');
    assert.strictEqual(refRes.body.data.fee.paymentReference, 'UPI/20261026/8947219842');

    // 3 games = ₹15
    const res3 = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Test Fee Three',
          mobileNumber: '9876543213',
          rollNumber: '2024FEE003',
          course: 'B.Tech',
          branch: 'CSE',
          academicYear: '2nd Year'
        },
        selectedGames: [
          { gameId: 'lemon-race', participationType: 'individual' },
          { gameId: 'musical-chairs', participationType: 'individual' },
          { gameId: 'balloon-dual-race', participationType: 'team', teamName: 'Duo Flyers', teamMembers: [{ name: 'Partner One', roll: '2024P01' }] }
        ]
      });

    assert.strictEqual(res3.status, 201);
    assert.strictEqual(res3.body.data.fee.totalAmount, 15);
    assert.strictEqual(res3.body.data.fee.selectedGamesCount, 3);
    assert.strictEqual(res3.body.data.fee.paymentStatus, 'payment_pending');

    // 6 games = ₹30
    const res6 = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Test Fee Six',
          mobileNumber: '9876543216',
          rollNumber: '2024FEE006',
          course: 'B.Tech',
          branch: 'CSE',
          academicYear: '3rd Year'
        },
        selectedGames: [
          { gameId: 'lemon-race', participationType: 'individual' },
          { gameId: 'target-shooting', participationType: 'individual' },
          { gameId: 'musical-chairs', participationType: 'individual' },
          { gameId: 'human-knot', participationType: 'team', teamName: 'Squad Knot', teamMembers: [{ name: 'Squad Member 1', roll: 'R1' }] },
          { gameId: 'cup-balloon-pyramid', participationType: 'individual' },
          { gameId: 'balloon-dual-race', participationType: 'team', teamName: 'Pair Duo', teamMembers: [{ name: 'Duo Partner', roll: 'R2' }] }
        ]
      });

    assert.strictEqual(res6.status, 201);
    assert.strictEqual(res6.body.data.fee.totalAmount, 30);
    assert.strictEqual(res6.body.data.fee.selectedGamesCount, 6);
    assert.strictEqual(res6.body.data.fee.paymentStatus, 'payment_pending');
  });

  // 15. Database Connection Failure Behavior
  test('15. Database connection failure returns 503 on /api/health and handles write failure safely without leaks', async () => {
    // Temporarily disconnect to verify failure handling
    await mongoose.connection.close();

    const healthRes = await request(app).get('/api/health');
    assert.strictEqual(healthRes.status, 503);
    assert.strictEqual(healthRes.body.status, 'degraded');
    assert.strictEqual(healthRes.body.database, 'disconnected');

    // Attempting a write when disconnected should fail gracefully without leaking database credentials or stacks
    const postRes = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Test Disconnect',
          mobileNumber: '9876543210',
          rollNumber: '2024TEST001',
          course: 'B.Tech',
          branch: 'CSE',
          academicYear: '1st Year'
        },
        selectedGames: [{ gameId: 'lemon-race', participationType: 'individual' }]
      });

    assert.strictEqual(postRes.status, 500);
    assert.strictEqual(postRes.body.success, false);
    assert.strictEqual(postRes.body.stack, undefined);
    assert.strictEqual(postRes.body.MONGODB_URI, undefined);
  });
});
