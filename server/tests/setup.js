const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');

let mongoServer;

const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create test accounts
  const password = 'TestPassword@123';

  const hr = await User.create({
    employeeId: 'TEST_HR',
    firstName: 'HR',
    lastName: 'Admin',
    email: 'test_hr@staffsync.com',
    password,
    role: 'HR',
    department: 'Human Resources',
    designation: 'HR Lead',
    status: 'ACTIVE',
  });

  const manager = await User.create({
    employeeId: 'TEST_MGR',
    firstName: 'Manager',
    lastName: 'Boss',
    email: 'test_manager@staffsync.com',
    password,
    role: 'MANAGER',
    department: 'Engineering',
    designation: 'Tech Lead',
    status: 'ACTIVE',
    manager: hr._id,
  });

  const employee = await User.create({
    employeeId: 'TEST_EMP',
    firstName: 'Emp',
    lastName: 'Worker',
    email: 'test_emp@staffsync.com',
    password,
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Software Engineer',
    status: 'ACTIVE',
    manager: manager._id,
  });

  // Create leave balances
  const curYear = new Date().getFullYear();
  await LeaveBalance.create({
    user: employee._id,
    year: curYear,
    casualLeave: { total: 12, used: 0 },
    sickLeave: { total: 10, used: 0 },
    earnedLeave: { total: 15, used: 0 },
    unpaidLeave: { used: 0 },
  });

  return { hr, manager, employee, password };
};

const teardownTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { setupTestDB, teardownTestDB };
