const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env (same convention as scripts/seed.js)
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const TARGET_EMAIL = 'john.doe@staffsync.com';
const TARGET_EMPLOYEE_ID = 'EMP001';
const MIN_PASSWORD_LENGTH = 6;

const createStaffDemoAccount = async () => {
  let connected = false;

  try {
    await connectDB();
    connected = true;

    console.log('[Staff Demo] Checking for existing Staff Employee demo account...');

    const [userByEmail, userByEmployeeId] = await Promise.all([
      User.findOne({ email: TARGET_EMAIL.toLowerCase().trim() }),
      User.findOne({ employeeId: TARGET_EMPLOYEE_ID }),
    ]);

    const sameAccount =
      userByEmail && userByEmployeeId && userByEmail._id.equals(userByEmployeeId._id);

    // Case 1: both identifiers already point to the same existing account — do not overwrite
    if (sameAccount) {
      console.log('[Staff Demo] Staff Employee demo account already exists. No changes made.');
      console.log(`   Email:        ${userByEmail.email}`);
      console.log(`   Employee ID:  ${userByEmployeeId.employeeId}`);
      console.log(`   Name:         ${userByEmail.firstName} ${userByEmail.lastName}`);
      console.log(`   Role:         ${userByEmail.role}`);
      console.log(`   Department:   ${userByEmail.department}`);
      console.log(`   Status:       ${userByEmail.status}`);
      console.log('[Staff Demo] Existing account was not overwritten.');
      await disconnectDB();
      process.exit(0);
      return;
    }

    // Cases 2-4: conflict — an identifier belongs to a different existing account
    if (userByEmail && !userByEmployeeId) {
      console.error(
        '[Staff Demo] CONFLICT: Email john.doe@staffsync.com is already registered to a different account.'
      );
      console.error(`         Existing account employee ID: ${userByEmail.employeeId}`);
      console.error(
        '[Staff Demo] Aborting. No changes were made. Resolve the conflict or use a different email/employee ID.'
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (userByEmployeeId && !userByEmail) {
      console.error(
        '[Staff Demo] CONFLICT: Employee ID EMP001 is already assigned to a different account.'
      );
      console.error(`         Existing account email: ${userByEmployeeId.email}`);
      console.error(
        '[Staff Demo] Aborting. No changes were made. Resolve the conflict or use a different email/employee ID.'
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (userByEmail && userByEmployeeId) {
      console.error(
        '[Staff Demo] CONFLICT: john.doe@staffsync.com and EMP001 belong to two different existing accounts.'
      );
      console.error(
        `         Email account:     ${userByEmail.email}     (employee ID ${userByEmail.employeeId})`
      );
      console.error(
        `         Employee ID account: ${userByEmployeeId.email} (employee ID ${userByEmployeeId.employeeId})`
      );
      console.error('[Staff Demo] Aborting. No changes were made.');
      await disconnectDB();
      process.exit(1);
      return;
    }

    // Case 5: neither exists — create the Staff Employee demo account
    const password = process.env.STAFFSYNC_STAFF_PASSWORD;

    if (!password) {
      console.error(
        '[Staff Demo] ERROR: STAFFSYNC_STAFF_PASSWORD environment variable is not set.'
      );
      console.error(
        '         Provide a unique temporary development password, e.g.:'
      );
      console.error(
        '         Windows PowerShell: $env:STAFFSYNC_STAFF_PASSWORD="your_temp_password"'
      );
      console.error(
        '         Windows CMD:        set STAFFSYNC_STAFF_PASSWORD=your_temp_password'
      );
      console.error(
        '         macOS/Linux:        export STAFFSYNC_STAFF_PASSWORD=your_temp_password'
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(
        `[Staff Demo] ERROR: STAFFSYNC_STAFF_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      await disconnectDB();
      process.exit(1);
      return;
    }

    const staffUser = await User.create({
      employeeId: TARGET_EMPLOYEE_ID,
      firstName: 'John',
      lastName: 'Doe',
      email: TARGET_EMAIL,
      password, // plaintext here; hashed automatically by User model pre('save') hook (bcryptjs)
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Senior Full Stack Developer',
      status: 'ACTIVE',
    });

    console.log('\n======================================================');
    console.log('      STAFF EMPLOYEE DEMO ACCOUNT CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`   Email:         ${staffUser.email}`);
    console.log(`   Employee ID:   ${staffUser.employeeId}`);
    console.log(`   Name:          ${staffUser.firstName} ${staffUser.lastName}`);
    console.log(`   Role:          ${staffUser.role}`);
    console.log(`   Department:    ${staffUser.department}`);
    console.log(`   Status:        ${staffUser.status}`);
    console.log(
      '   Password:      [set via STAFFSYNC_STAFF_PASSWORD - hashed, never stored plainly]'
    );
    console.log('======================================================\n');
    console.log(
      '[Staff Demo] Password was hashed using the project bcryptjs pre-save hook; no plaintext password is stored.'
    );
    console.log(
      '[Staff Demo] You can now log in at POST /api/auth/login with the email and STAFFSYNC_STAFF_PASSWORD.'
    );
    console.log(
      '[Staff Demo] Dashboard: role EMPLOYEE opens the Self-Service (attendance/leave) dashboard.'
    );

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Staff Demo] Unexpected error:', err.message);
    if (connected) {
      try {
        await disconnectDB();
      } catch (discErr) {
        console.error('[Staff Demo] Error while disconnecting:', discErr.message);
      }
    }
    process.exit(1);
  }
};

createStaffDemoAccount();
