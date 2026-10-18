const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env (same convention as scripts/seed.js)
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const TARGET_EMAIL = 'manager@staffsync.com';
const TARGET_EMPLOYEE_ID = 'MGR001';
const MIN_PASSWORD_LENGTH = 6;

// NOTE: StaffSync has no separate "ENGINEER" role. Per the project's role
// conventions (User.role enum: HR, MANAGER, EMPLOYEE), the Engineer/Manager
// responsibility is a single MANAGER role (see README "Engineering Manager"
// and route guards allowing ['HR', 'MANAGER']).
const DEMO_ROLE = 'MANAGER';

const createManagerDemoAccount = async () => {
  let connected = false;

  try {
    await connectDB();
    connected = true;

    console.log('[Manager Demo] Checking for existing Engineer/Manager demo account...');

    const [userByEmail, userByEmployeeId] = await Promise.all([
      User.findOne({ email: TARGET_EMAIL.toLowerCase().trim() }),
      User.findOne({ employeeId: TARGET_EMPLOYEE_ID }),
    ]);

    const sameAccount =
      userByEmail && userByEmployeeId && userByEmail._id.equals(userByEmployeeId._id);

    // Case 1: both identifiers already point to the same existing account — do not overwrite
    if (sameAccount) {
      console.log(
        '[Manager Demo] Engineer/Manager demo account already exists. No changes made.'
      );
      console.log(`   Email:        ${userByEmail.email}`);
      console.log(`   Employee ID:  ${userByEmployeeId.employeeId}`);
      console.log(`   Name:         ${userByEmail.firstName} ${userByEmail.lastName}`);
      console.log(`   Role:         ${userByEmail.role}`);
      console.log(`   Department:   ${userByEmail.department}`);
      console.log(`   Status:       ${userByEmail.status}`);
      console.log('[Manager Demo] Existing account was not overwritten.');
      await disconnectDB();
      process.exit(0);
      return;
    }

    // Cases 2-4: conflict — an identifier belongs to a different existing account
    if (userByEmail && !userByEmployeeId) {
      console.error(
        '[Manager Demo] CONFLICT: Email manager@staffsync.com is already registered to a different account.'
      );
      console.error(`         Existing account employee ID: ${userByEmail.employeeId}`);
      console.error(
        '[Manager Demo] Aborting. No changes were made. Resolve the conflict or use a different email/employee ID.'
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (userByEmployeeId && !userByEmail) {
      console.error(
        '[Manager Demo] CONFLICT: Employee ID MGR001 is already assigned to a different account.'
      );
      console.error(`         Existing account email: ${userByEmployeeId.email}`);
      console.error(
        '[Manager Demo] Aborting. No changes were made. Resolve the conflict or use a different email/employee ID.'
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (userByEmail && userByEmployeeId) {
      console.error(
        '[Manager Demo] CONFLICT: manager@staffsync.com and MGR001 belong to two different existing accounts.'
      );
      console.error(`         Email account:     ${userByEmail.email}     (employee ID ${userByEmail.employeeId})`);
      console.error(
        `         Employee ID account: ${userByEmployeeId.email} (employee ID ${userByEmployeeId.employeeId})`
      );
      console.error('[Manager Demo] Aborting. No changes were made.');
      await disconnectDB();
      process.exit(1);
      return;
    }

    // Case 5: neither exists — create the Engineer/Manager demo account
    const password = process.env.STAFFSYNC_MANAGER_PASSWORD;

    if (!password) {
      console.error(
        '[Manager Demo] ERROR: STAFFSYNC_MANAGER_PASSWORD environment variable is not set.'
      );
      console.error(
        '         Provide a unique temporary development password, e.g.:'
      );
      console.error(
        '         Windows PowerShell: $env:STAFFSYNC_MANAGER_PASSWORD="your_temp_password"'
      );
      console.error(
        '         Windows CMD:        set STAFFSYNC_MANAGER_PASSWORD=your_temp_password'
      );
      console.error(
        '         macOS/Linux:        export STAFFSYNC_MANAGER_PASSWORD=your_temp_password'
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(
        `[Manager Demo] ERROR: STAFFSYNC_MANAGER_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    const managerUser = await User.create({
      employeeId: TARGET_EMPLOYEE_ID,
      firstName: 'Michael',
      lastName: 'Vance',
      email: TARGET_EMAIL,
      password, // plaintext here; hashed automatically by User model pre('save') hook (bcryptjs)
      role: DEMO_ROLE,
      department: 'Engineering',
      designation: 'Engineering Manager',
      status: 'ACTIVE',
    });

    console.log('\n======================================================');
    console.log('    ENGINEER / MANAGER DEMO ACCOUNT CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`   Email:         ${managerUser.email}`);
    console.log(`   Employee ID:   ${managerUser.employeeId}`);
    console.log(`   Name:          ${managerUser.firstName} ${managerUser.lastName}`);
    console.log(`   Role:          ${managerUser.role} (Engineer/Manager combined)`);
    console.log(`   Department:    ${managerUser.department}`);
    console.log(`   Status:        ${managerUser.status}`);
    console.log(
      '   Password:      [set via STAFFSYNC_MANAGER_PASSWORD - hashed, never stored plainly]'
    );
    console.log('======================================================\n');
    console.log(
      '[Manager Demo] Password was hashed using the project bcryptjs pre-save hook; no plaintext password is stored.'
    );
    console.log(
      '[Manager Demo] You can now log in at POST /api/auth/login with the email and STAFFSYNC_MANAGER_PASSWORD.'
    );
    console.log(
      '[Manager Demo] Dashboard: role MANAGER opens the Team Operations & Approvals dashboard.'
    );

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Manager Demo] Unexpected error:', err.message);
    if (connected) {
      try {
        await disconnectDB();
      } catch (discErr) {
        console.error('[Manager Demo] Error while disconnecting:', discErr.message);
      }
    }
    process.exit(1);
  }
};

createManagerDemoAccount();
