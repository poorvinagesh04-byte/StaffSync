const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env (same convention as scripts/seed.js)
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const TARGET_EMAIL = 'hr@staffsync.com';
const TARGET_EMPLOYEE_ID = 'HR001';
const MIN_PASSWORD_LENGTH = 6;

const createHrDemoAccount = async () => {
  let connected = false;

  try {
    await connectDB();
    connected = true;

    console.log('[HR Demo] Checking for existing HR demo account...');

    const [userByEmail, userByEmployeeId] = await Promise.all([
      User.findOne({ email: TARGET_EMAIL.toLowerCase().trim() }),
      User.findOne({ employeeId: TARGET_EMPLOYEE_ID }),
    ]);

    const sameAccount =
      userByEmail && userByEmployeeId && userByEmail._id.equals(userByEmployeeId._id);

    // Case 1: both identifiers already point to the same existing account — do not overwrite
    if (sameAccount) {
      console.log('[HR Demo] HR demo account already exists. No changes made.');
      console.log(`   Email:        ${userByEmail.email}`);
      console.log(`   Employee ID:  ${userByEmployeeId.employeeId}`);
      console.log(`   Name:         ${userByEmail.firstName} ${userByEmail.lastName}`);
      console.log(`   Role:         ${userByEmail.role}`);
      console.log(`   Department:   ${userByEmail.department}`);
      console.log(`   Status:       ${userByEmail.status}`);
      console.log('[HR Demo] Existing account was not overwritten.');
      await disconnectDB();
      process.exit(0);
      return;
    }

    // Cases 2-4: conflict — an identifier belongs to a different existing account
    if (userByEmail && !userByEmployeeId) {
      console.error('[HR Demo] CONFLICT: Email hr@staffsync.com is already registered to a different account.');
      console.error(`         Existing account employee ID: ${userByEmail.employeeId}`);
      console.error('[HR Demo] Aborting. No changes were made. Resolve the conflict or use a different email/employee ID.');
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (userByEmployeeId && !userByEmail) {
      console.error('[HR Demo] CONFLICT: Employee ID HR001 is already assigned to a different account.');
      console.error(`         Existing account email: ${userByEmployeeId.email}`);
      console.error('[HR Demo] Aborting. No changes were made. Resolve the conflict or use a different email/employee ID.');
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (userByEmail && userByEmployeeId) {
      console.error('[HR Demo] CONFLICT: hr@staffsync.com and HR001 belong to two different existing accounts.');
      console.error(`         Email account:     ${userByEmail.email}     (employee ID ${userByEmail.employeeId})`);
      console.error(`         Employee ID account: ${userByEmployeeId.email} (employee ID ${userByEmployeeId.employeeId})`);
      console.error('[HR Demo] Aborting. No changes were made.');
      await disconnectDB();
      process.exit(1);
      return;
    }

    // Case 5: neither exists — create the HR demo account
    const password = process.env.STAFFSYNC_HR_PASSWORD;

    if (!password) {
      console.error('[HR Demo] ERROR: STAFFSYNC_HR_PASSWORD environment variable is not set.');
      console.error('         Provide a unique temporary development password, e.g.:');
      console.error('         Windows PowerShell: $env:STAFFSYNC_HR_PASSWORD="your_temp_password"');
      console.error('         Windows CMD:        set STAFFSYNC_HR_PASSWORD=your_temp_password');
      console.error('         macOS/Linux:        export STAFFSYNC_HR_PASSWORD=your_temp_password');
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(`[HR Demo] ERROR: STAFFSYNC_HR_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      await disconnectDB();
      process.exit(1);
      return;
    }

    const hrUser = await User.create({
      employeeId: TARGET_EMPLOYEE_ID,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: TARGET_EMAIL,
      password, // plaintext here; hashed automatically by User model pre('save') hook (bcryptjs)
      role: 'HR',
      department: 'Human Resources',
      designation: 'Head of People Operations',
      status: 'ACTIVE',
    });

    console.log('\n======================================================');
    console.log('    HR DEMO ACCOUNT CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`   Email:         ${hrUser.email}`);
    console.log(`   Employee ID:   ${hrUser.employeeId}`);
    console.log(`   Name:          ${hrUser.firstName} ${hrUser.lastName}`);
    console.log(`   Role:          ${hrUser.role}`);
    console.log(`   Department:    ${hrUser.department}`);
    console.log(`   Status:        ${hrUser.status}`);
    console.log('   Password:      [set via STAFFSYNC_HR_PASSWORD - hashed, never stored plainly]');
    console.log('======================================================\n');
    console.log('[HR Demo] Password was hashed using the project bcryptjs pre-save hook; no plaintext password is stored.');
    console.log('[HR Demo] You can now log in at POST /api/auth/login with the email and STAFFSYNC_HR_PASSWORD.');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[HR Demo] Unexpected error:', err.message);
    if (connected) {
      try {
        await disconnectDB();
      } catch (discErr) {
        console.error('[HR Demo] Error while disconnecting:', discErr.message);
      }
    }
    process.exit(1);
  }
};

createHrDemoAccount();
