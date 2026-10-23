const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

// Configure isolated test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/srmu_fun_games_admin_test';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'TestPassword123!';

const app = require('../src/app');
const Registration = require('../src/models/Registration');
const AdminUser = require('../src/models/AdminUser');
const AdminSession = require('../src/models/AdminSession');

describe('Vijayadashami Carnival — Phase 6 Admin Dashboard Test Suite', () => {
  let authCookie = null;
  let csrfToken = null;
  let testReg1 = null;
  let testReg2 = null;

  before(async () => {
    // 1. Connect to isolated test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
    }

    // 2. Clear collections
    await Registration.deleteMany({});
    await AdminUser.deleteMany({});
    await AdminSession.deleteMany({});

    // 3. Create test admin account
    const passwordHash = await AdminUser.hashPassword('TestPassword123!');
    await AdminUser.create({
      username: 'testadmin',
      passwordHash,
      fullName: 'Test Organizer Lead',
      role: 'admin'
    });

    // 4. Seed test registrations
    // Reg 1: Multi-game student (Lemon Race solo + Treasure Hunt team)
    testReg1 = await Registration.createWithCollisionHandling({
      student: {
        fullName: 'Rohit Sharma',
        mobileNumber: '+919876543210',
        rollNumber: '2024SRMU901',
        course: 'B.Tech',
        branch: 'Computer Science',
        academicYear: '3rd Year'
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
          teamName: 'Maverick Hackers',
          teamMembers: [
            { name: 'Kunal Verma', roll: '2024SRMU902', contact: '9876543211' }
          ]
        }
      ],
      status: 'confirmed'
    });

    // Reg 2: Solo student for Musical Chairs
    testReg2 = await Registration.createWithCollisionHandling({
      student: {
        fullName: '=SUM(1+2)', // Potential formula injection payload to test sanitizer!
        mobileNumber: '+919876543212',
        rollNumber: '2024SRMU903',
        course: 'BBA',
        branch: 'Finance',
        academicYear: '1st Year'
      },
      selectedGames: [
        {
          gameId: 'musical-chairs',
          gameName: 'Musical Chairs',
          participationType: 'individual'
        }
      ],
      status: 'pending'
    });
  });

  after(async () => {
    try {
      await Registration.deleteMany({});
      await AdminUser.deleteMany({});
      await AdminSession.deleteMany({});
      await mongoose.connection.close();
    } catch {
      // Ignore disconnect errors
    }
  });

  // 1. Unauthenticated Access Protection
  test('1. Unauthenticated users cannot access admin dashboard APIs (401)', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Authentication required'));
  });

  // 2. Invalid Login Attempts (Wrong Password)
  test('2. Invalid login attempts with wrong password return generic 401', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'WrongPassword999' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Invalid username or password');
  });

  // 3. Invalid Login Attempts (Non-existent user)
  test('3. Invalid login with non-existent username returns same generic 401', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'ghostuser', password: 'SomePassword' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Invalid username or password');
  });

  // 4. Valid Administrator Authentication
  test('4. Valid administrator authentication succeeds, sets session cookie and returns csrfToken', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'TestPassword123!' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.admin.username, 'testadmin');
    assert.ok(res.body.csrfToken);

    // Capture cookies and CSRF token for subsequent tests
    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie);
    const sessionCookieHeader = setCookie.find(c => c.startsWith('srmu_admin_session='));
    assert.ok(sessionCookieHeader);
    assert.ok(sessionCookieHeader.includes('HttpOnly'));

    authCookie = sessionCookieHeader.split(';')[0];
    csrfToken = res.body.csrfToken;
  });

  // 5. Active Session Verification (GET /api/admin/me)
  test('5. GET /api/admin/me returns authenticated admin identity with valid cookie', async () => {
    const res = await request(app)
      .get('/api/admin/me')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.authenticated, true);
    assert.strictEqual(res.body.admin.username, 'testadmin');
    assert.strictEqual(res.body.csrfToken, csrfToken);
  });

  // 6. Dashboard Statistics Calculation
  test('6. Dashboard statistics match actual database records accurately', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const s = res.body.data.summary;
    assert.strictEqual(s.totalRegistrations, 2);
    assert.strictEqual(s.confirmedRegistrations, 1);
    assert.strictEqual(s.pendingRegistrations, 1);
    assert.strictEqual(s.cancelledRegistrations, 0);

    // Multi-game breakdown:
    // Reg1 has 2 games (1 solo lemon, 1 team treasure hunt). Reg2 has 1 game (1 solo musical).
    // Total selected game entries = 3
    assert.strictEqual(s.totalSelectedGameEntries, 3);
    assert.strictEqual(s.totalIndividualEntries, 2);
    assert.strictEqual(s.totalTeamEntries, 1);
    assert.strictEqual(s.totalTeamMembersListed, 1);
  });

  // 7. Multi-Game Student Counting Policy
  test('7. Student registered for multiple games counts as 1 unique registration and appears in both games', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', authCookie);

    const stats = res.body.data.gameStats;
    const lemon = stats.find(g => g.id === 'lemon-race');
    const treasure = stats.find(g => g.id === 'treasure-hunt');
    const chairs = stats.find(g => g.id === 'musical-chairs');

    assert.strictEqual(lemon.totalEntries, 1);
    assert.strictEqual(lemon.individualEntries, 1);

    assert.strictEqual(treasure.totalEntries, 1);
    assert.strictEqual(treasure.teamEntries, 1);
    assert.strictEqual(treasure.teamMembersCount, 1);

    assert.strictEqual(chairs.totalEntries, 1);
    assert.strictEqual(chairs.individualEntries, 1);

    const targetShooting = stats.find(g => g.id === 'target-shooting');
    assert.ok(targetShooting, 'Target Shooting should be present in gameStats');
    assert.strictEqual(targetShooting.totalEntries, 0);
  });

  // 8. Search Registrations
  test('8. Search by name, roll number, or registrationId returns matching records', async () => {
    // Search by name
    const resName = await request(app)
      .get('/api/admin/registrations?search=Rohit')
      .set('Cookie', authCookie);
    assert.strictEqual(resName.status, 200);
    assert.strictEqual(resName.body.registrations.length, 1);
    assert.strictEqual(resName.body.registrations[0].registrationId, testReg1.registrationId);

    // Search by registration ID
    const resId = await request(app)
      .get(`/api/admin/registrations?search=${testReg2.registrationId}`)
      .set('Cookie', authCookie);
    assert.strictEqual(resId.status, 200);
    assert.strictEqual(resId.body.registrations.length, 1);
    assert.strictEqual(resId.body.registrations[0].registrationId, testReg2.registrationId);
  });

  // 9. Filter Registrations
  test('9. Filtering by game, format, and status returns correct records', async () => {
    const resGame = await request(app)
      .get('/api/admin/registrations?game=lemon-race')
      .set('Cookie', authCookie);
    assert.strictEqual(resGame.status, 200);
    assert.strictEqual(resGame.body.registrations.length, 1);

    const resStatus = await request(app)
      .get('/api/admin/registrations?status=pending')
      .set('Cookie', authCookie);
    assert.strictEqual(resStatus.status, 200);
    assert.strictEqual(resStatus.body.registrations.length, 1);
    assert.strictEqual(resStatus.body.registrations[0].registrationId, testReg2.registrationId);
  });

  // 10. Privacy in List View
  test('10. Registration table list view masks mobile phone numbers for privacy', async () => {
    const res = await request(app)
      .get('/api/admin/registrations')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    res.body.registrations.forEach(r => {
      assert.ok(r.student.maskedMobile);
      assert.strictEqual(r.student.mobileNumber, undefined);
      assert.ok(r.student.maskedMobile.includes('••••••'));
    });
  });

  // 11. Pagination
  test('11. Pagination correctly calculates page, limit, and totalPages', async () => {
    const res = await request(app)
      .get('/api/admin/registrations?page=1&limit=1')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.registrations.length, 1);
    assert.strictEqual(res.body.pagination.page, 1);
    assert.strictEqual(res.body.pagination.limit, 1);
    assert.strictEqual(res.body.pagination.total, 2);
    assert.strictEqual(res.body.pagination.totalPages, 2);
  });

  // 12. Full Registration Details
  test('12. Authenticated organizer can view unmasked registration details', async () => {
    const res = await request(app)
      .get(`/api/admin/registrations/${testReg1.registrationId}`)
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.registrationId, testReg1.registrationId);
    assert.strictEqual(res.body.data.student.mobileNumber, '+919876543210'); // Unmasked for organizer
    assert.strictEqual(res.body.data.selectedGames.length, 2);
  });

  // 13. Unauthorized Registration Details
  test('13. Unauthenticated request to registration details is rejected with 401', async () => {
    const res = await request(app)
      .get(`/api/admin/registrations/${testReg1.registrationId}`);

    assert.strictEqual(res.status, 401);
  });

  // 14. CSRF Protection on Updates
  test('14. PATCH registration without X-CSRF-Token header is rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/admin/registrations/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .send({ status: 'confirmed' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('CSRF'));
  });

  // 15. Valid Status Update
  test('15. PATCH registration with valid CSRF token updates status in database', async () => {
    const res = await request(app)
      .patch(`/api/admin/registrations/${testReg2.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'confirmed' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.registration.status, 'confirmed');

    // Verify in database
    const updated = await Registration.findOne({ registrationId: testReg2.registrationId });
    assert.strictEqual(updated.status, 'confirmed');
  });

  // 16. Invalid Status Payload
  test('16. Invalid status payload is rejected with 400 Bad Request', async () => {
    const res = await request(app)
      .patch(`/api/admin/registrations/${testReg1.registrationId}`)
      .set('Cookie', authCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'disqualified_invalid_status' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // 17. Game-wise Participants Endpoint
  test('17. Game-wise participant endpoint returns roster and estimated players', async () => {
    const res = await request(app)
      .get('/api/admin/games/treasure-hunt/registrations')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.metrics.totalRegistrations, 1);
    assert.strictEqual(res.body.data.metrics.teamEntries, 1);
    assert.strictEqual(res.body.data.metrics.totalEstimatedPlayers, 2); // 1 leader + 1 member
    assert.strictEqual(res.body.data.participants.length, 1);
    assert.strictEqual(res.body.data.participants[0].teamName, 'Maverick Hackers');

    // Verify Target Shooting roster is accessible
    const targetRes = await request(app)
      .get('/api/admin/games/target-shooting/registrations')
      .set('Cookie', authCookie);

    assert.strictEqual(targetRes.status, 200);
    assert.strictEqual(targetRes.body.success, true);
    assert.strictEqual(targetRes.body.data.game.name, 'Target Shooting');
    assert.strictEqual(targetRes.body.data.metrics.totalRegistrations, 0);
  });

  // 18. CSV Export Authentication & Formula Injection Sanitization
  test('18. CSV export requires authentication and sanitizes formula injection characters', async () => {
    // Unauthenticated export -> 401
    const unauthRes = await request(app).get('/api/admin/registrations/export');
    assert.strictEqual(unauthRes.status, 401);

    // Authenticated export -> 200 with sanitized CSV
    const res = await request(app)
      .get('/api/admin/registrations/export')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'], 'text/csv; charset=utf-8');
    assert.ok(res.headers['content-disposition'].includes('srmu-registrations-'));

    const csvContent = res.text;
    assert.ok(csvContent.includes('Registration ID'));

    // Check that '=SUM(1+2)' was sanitized to "'=SUM(1+2)"
    assert.ok(csvContent.includes("''=SUM(1+2)") || csvContent.includes("'=SUM(1+2)"));
    // Ensure dangerous leading equals wasn't raw
    assert.ok(!csvContent.includes(',"=SUM(1+2)"'));
  });

  // 19. Session Expiration
  test('19. Session expiration is handled properly', async () => {
    // Manually expire the session in MongoDB
    await AdminSession.updateOne(
      { username: 'testadmin' },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const res = await request(app)
      .get('/api/admin/me')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('expired'));
  });

  // 20. Logout Invalidates Session
  test('20. Logout invalidates the server-side session and subsequent calls return 401', async () => {
    // Re-login to get a fresh session
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'TestPassword123!' });

    const newCookieHeader = loginRes.headers['set-cookie'].find(c => c.startsWith('srmu_admin_session='));
    const newCookie = newCookieHeader.split(';')[0];
    const newCsrf = loginRes.body.csrfToken;

    // Logout
    const logoutRes = await request(app)
      .post('/api/admin/logout')
      .set('Cookie', newCookie)
      .set('X-CSRF-Token', newCsrf);

    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.body.success, true);

    // Call /me with logged-out cookie -> 401
    const meRes = await request(app)
      .get('/api/admin/me')
      .set('Cookie', newCookie);

    assert.strictEqual(meRes.status, 401);
  });

  // 21. Phase 5 Public Registration Still Works Cleanly
  test('21. Phase 5 public student registration creation still works with 201 Created', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        student: {
          fullName: 'Ananya Gupta',
          mobileNumber: '9812345678',
          rollNumber: '2024SRMU777',
          course: 'B.Tech',
          branch: 'Information Technology',
          academicYear: '2nd Year'
        },
        selectedGames: [
          { gameId: 'human-knot', participationType: 'individual' }
        ]
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.registrationId.startsWith('SRMU-2026-'));
  });
});
