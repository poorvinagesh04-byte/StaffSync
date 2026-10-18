const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB } = require('./setup');

describe('StaffSync Full System Integration Tests', () => {
  let accounts;
  let hrToken;
  let managerToken;
  let employeeToken;

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_123456';
    accounts = await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  // 1. Authentication Tests
  describe('Authentication Module', () => {
    test('HR login succeeds with valid credentials and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_hr@staffsync.com', password: accounts.password });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'HR');
      assert.strictEqual(res.body.user.password, undefined); // Ensure password hash is NOT leaked

      hrToken = res.body.token;
    });

    test('Manager login succeeds and returns Manager role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_manager@staffsync.com', password: accounts.password });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'MANAGER');
      managerToken = res.body.token;
    });

    test('Employee login succeeds and returns Employee role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_emp@staffsync.com', password: accounts.password });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'EMPLOYEE');
      employeeToken = res.body.token;
    });

    test('Login fails with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_hr@staffsync.com', password: 'WrongPassword!' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test('GET /api/auth/me returns current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, 'test_emp@staffsync.com');
      assert.strictEqual(res.body.user.password, undefined);
    });

    test('GET /api/auth/me fails with 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.strictEqual(res.status, 401);
    });
  });

  // 2. Role-Based Authorization Tests
  describe('Role-Based Authorization', () => {
    test('EMPLOYEE is forbidden (403) from creating new employees', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: 'EMP_HACK',
          firstName: 'Unauthorized',
          lastName: 'User',
          email: 'unauth@staffsync.com',
          department: 'Engineering',
          designation: 'Hacker',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    test('HR is authorized to create a new employee', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: 'EMP_NEW',
          firstName: 'Robert',
          lastName: 'Brown',
          email: 'robert.brown@staffsync.com',
          department: 'Engineering',
          designation: 'Junior Developer',
          role: 'EMPLOYEE',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.employee.employeeId, 'EMP_NEW');
    });

    test('HR is authorized to get eligible managers list', async () => {
      const res = await request(app)
        .get('/api/employees/managers')
        .set('Authorization', `Bearer ${hrToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.managers));
      assert.ok(res.body.managers.length >= 2);
    });
  });

  // 3. Attendance Workflow Tests
  describe('Attendance Workflow', () => {
    test('Employee can successfully check-in for today', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.record.checkIn);
    });

    test('Duplicate check-in on the same day is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already checked in/i);
    });

    test('Employee can successfully check-out for today', async () => {
      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.record.checkOut);
    });

    test('Duplicate check-out on the same day is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already checked out/i);
    });
  });

  // 4. Leave Management Workflow Tests
  describe('Leave Management Workflow', () => {
    let leaveRequestId;

    test('Employee can view their leave balances', async () => {
      const res = await request(app)
        .get('/api/leaves/balances')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.balance.casualLeave.total, 12);
      assert.strictEqual(res.body.balance.casualLeave.used, 0);
    });

    test('Employee applies for 2 days of casual leave', async () => {
      const start = new Date();
      start.setDate(start.getDate() + 10);
      const end = new Date();
      end.setDate(end.getDate() + 11);

      const res = await request(app)
        .post('/api/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveType: 'CASUAL',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: 'Doctor appointment and medical checkup.',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.leaveRequest.status, 'PENDING');
      assert.strictEqual(res.body.leaveRequest.durationDays, 2);

      leaveRequestId = res.body.leaveRequest._id;
    });

    test('Applying for overlapping leave dates is rejected (400)', async () => {
      const start = new Date();
      start.setDate(start.getDate() + 10);
      const end = new Date();
      end.setDate(end.getDate() + 12);

      const res = await request(app)
        .post('/api/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveType: 'CASUAL',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: 'Overlapping request test.',
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /overlapping/i);
    });

    test('Manager reviews and approves the direct report leave request', async () => {
      const res = await request(app)
        .patch(`/api/leaves/${leaveRequestId}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'APPROVED',
          reviewComment: 'Approved by engineering manager.',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.leave.status, 'APPROVED');
      assert.strictEqual(res.body.leave.reviewComment, 'Approved by engineering manager.');
    });

    test('Leave balance was updated after approval', async () => {
      const res = await request(app)
        .get('/api/leaves/balances')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.balance.casualLeave.used, 2); // 2 days deducted
    });

    test('Employee can apply and cancel an eligible pending leave', async () => {
      const start = new Date();
      start.setDate(start.getDate() + 20);
      const end = new Date();
      end.setDate(end.getDate() + 20);

      const applyRes = await request(app)
        .post('/api/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveType: 'CASUAL',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: 'Will be cancelled.',
        });

      assert.strictEqual(applyRes.status, 201);
      const tempId = applyRes.body.leaveRequest._id;

      const cancelRes = await request(app)
        .patch(`/api/leaves/${tempId}/cancel`)
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(cancelRes.status, 200);
      assert.strictEqual(cancelRes.body.leave.status, 'CANCELLED');
    });
  });

  // 5. Announcements and Training Workflows
  describe('Announcements and Training Modules', () => {
    let trainingId;

    test('HR publishes a company announcement', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: 'Quarterly Townhall 2025',
          content: 'Join the CEO and leadership for the quarterly all-hands presentation.',
          targetAudience: 'ALL',
          priority: 'HIGH',
          isPinned: true,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.announcement.title, 'Quarterly Townhall 2025');
    });

    test('Employee can read published announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.announcements.length > 0);
    });

    test('HR creates a training program', async () => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);

      const res = await request(app)
        .post('/api/training')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: 'Cybersecurity Fundamentals',
          description: 'Secure coding and threat modeling.',
          instructor: 'SecOps Team',
          category: 'COMPLIANCE',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });

      assert.strictEqual(res.status, 201);
      trainingId = res.body.program._id;
    });

    test('Employee updates progress on assigned training', async () => {
      const res = await request(app)
        .patch(`/api/training/${trainingId}/progress`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          status: 'IN_PROGRESS',
          progressPercent: 50,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.enrollment.progressPercent, 50);
      assert.strictEqual(res.body.enrollment.status, 'IN_PROGRESS');
    });
  });

  // 6. Manage Managers & Team Assignment Tests
  describe('Manager Management & Team Administration', () => {
    test('HR can view managers overview with direct report counts', async () => {
      const res = await request(app)
        .get('/api/employees/managers/overview')
        .set('Authorization', `Bearer ${hrToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.managers));
    });

    test('Employee is forbidden (403) from accessing managers overview', async () => {
      const res = await request(app)
        .get('/api/employees/managers/overview')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 403);
    });

    test('HR can reassign an employee to another manager', async () => {
      const res = await request(app)
        .put('/api/employees/reassign-manager')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: accounts.employee._id,
          newManagerId: accounts.hr._id,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });

  // 7. Performance Summaries & Access Controls
  describe('Performance Reviews & Metrics', () => {
    test('HR creates performance review for employee', async () => {
      const res = await request(app)
        .post('/api/performance')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: accounts.employee._id,
          reviewPeriod: 'Q1 2025',
          ratings: {
            technicalSkills: 5,
            communication: 4,
            punctuality: 5,
            leadership: 4,
            overallRating: 4.8,
          },
          goals: [
            { title: 'Deliver REST API architecture', status: 'ACHIEVED' },
            { title: 'Pass Security Audit', status: 'IN_PROGRESS' },
          ],
          strengths: 'Outstanding problem solver and collaborator.',
          improvements: 'Continue leading architecture reviews.',
          feedback: 'Consistent top performer in the engineering department.',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.review.reviewPeriod, 'Q1 2025');
    });

    test('Employee can view their own performance summary', async () => {
      const res = await request(app)
        .get('/api/performance/my-summary')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.metrics);
      assert.ok(typeof res.body.metrics.punctualityScore === 'number');
    });

    test('Employee is forbidden (403) from creating performance reviews', async () => {
      const res = await request(app)
        .post('/api/performance')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: accounts.hr._id,
          reviewPeriod: 'Q1 2025',
          feedback: 'Unauthorized review attempt.',
        });

      assert.strictEqual(res.status, 403);
    });
  });

  // 8. Health Check and Error Handling
  describe('System Health & Global Error Handling', () => {
    test('GET /api/health returns healthy system status', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'healthy');
      assert.strictEqual(res.body.service, 'StaffSync HRMS API');
    });

    test('Accessing non-existent endpoint returns structured 404', async () => {
      const res = await request(app).get('/api/non-existent-route-999');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Endpoint not found/i);
    });
  });
});
