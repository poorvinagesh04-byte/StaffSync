const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env')
});

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const TrainingProgram = require('../models/TrainingProgram');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      LeaveBalance.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Attendance.deleteMany({}),
      Announcement.deleteMany({}),
      TrainingProgram.deleteMany({}),
      TrainingEnrollment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    // Common default password for all seed accounts
    const password = 'StaffSync@2025';

    // 1. HR User
    const hr = await User.create({
      employeeId: 'HR001',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'hr@staffsync.com',
      password,
      role: 'HR',
      department: 'Human Resources',
      designation: 'Head of People Operations',
      phone: '+1 (555) 019-2831',
      status: 'ACTIVE',
      joiningDate: new Date('2022-01-15'),
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      address: {
        street: '100 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA',
      },
      emergencyContact: {
        name: 'David Jenkins',
        relationship: 'Spouse',
        phone: '+1 (555) 998-1122',
      },
      bio: 'Leading talent acquisition, employee experience, and people analytics at StaffSync.',
    });

    // 2. Manager User
    const manager = await User.create({
      employeeId: 'MGR001',
      firstName: 'Michael',
      lastName: 'Vance',
      email: 'manager@staffsync.com',
      password,
      role: 'MANAGER',
      department: 'Engineering',
      designation: 'Engineering Manager',
      phone: '+1 (555) 234-5678',
      status: 'ACTIVE',
      manager: hr._id,
      joiningDate: new Date('2022-04-10'),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      address: {
        street: '450 Silicon Blvd',
        city: 'San Francisco',
        state: 'CA',
        zip: '94107',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Rachel Vance',
        relationship: 'Spouse',
        phone: '+1 (555) 334-9988',
      },
      bio: 'Engineering leader focused on developer velocity, architecture, and team mentorship.',
    });

    // 3. Employee 1 - John Doe (Engineering)
    const emp1 = await User.create({
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@staffsync.com',
      password,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Senior Full Stack Developer',
      phone: '+1 (555) 456-7890',
      status: 'ACTIVE',
      manager: manager._id,
      joiningDate: new Date('2023-02-01'),
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      address: {
        street: '72 Market St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94103',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Mary Doe',
        relationship: 'Mother',
        phone: '+1 (555) 887-6543',
      },
      bio: 'Full-stack software engineer passionate about modern web apps and scalable cloud architectures.',
    });

    // 4. Employee 2 - Jane Smith (Marketing)
    const emp2 = await User.create({
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@staffsync.com',
      password,
      role: 'EMPLOYEE',
      department: 'Marketing',
      designation: 'Product Marketing Lead',
      phone: '+1 (555) 789-0123',
      status: 'ACTIVE',
      manager: hr._id,
      joiningDate: new Date('2023-05-15'),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      address: {
        street: '88 Union Square',
        city: 'San Francisco',
        state: 'CA',
        zip: '94108',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Robert Smith',
        relationship: 'Father',
        phone: '+1 (555) 667-8899',
      },
      bio: 'Driving brand awareness, customer success stories, and product launch marketing campaigns.',
    });

    // 5. Employee 3 - Alex Kumar (Engineering)
    const emp3 = await User.create({
      employeeId: 'EMP003',
      firstName: 'Alex',
      lastName: 'Kumar',
      email: 'alex.kumar@staffsync.com',
      password,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'DevOps & Cloud Engineer',
      phone: '+1 (555) 901-2345',
      status: 'ACTIVE',
      manager: manager._id,
      joiningDate: new Date('2023-08-20'),
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      address: {
        street: '150 Sunset Blvd',
        city: 'San Francisco',
        state: 'CA',
        zip: '94122',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Priya Kumar',
        relationship: 'Sister',
        phone: '+1 (555) 443-2211',
      },
      bio: 'Building CI/CD pipelines, container orchestration, and multi-region infrastructure reliability.',
    });

    const allUsers = [hr, manager, emp1, emp2, emp3];
    const currentYear = new Date().getFullYear();

    console.log('[Seed] Initializing Leave Balances...');
    for (const u of allUsers) {
      await LeaveBalance.create({
        user: u._id,
        year: currentYear,
        casualLeave: { total: 12, used: u === emp1 ? 3 : 1 },
        sickLeave: { total: 10, used: u === emp2 ? 2 : 0 },
        earnedLeave: { total: 15, used: 0 },
        unpaidLeave: { used: 0 },
      });
    }

    console.log('[Seed] Generating Attendance records for the past 7 days...');
    const pastDays = [6, 5, 4, 3, 2, 1, 0]; // 0 is today

    for (const daysAgo of pastDays) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const dateNorm = normalizeDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      if (!isWeekend) {
        for (const u of allUsers) {
          // If daysAgo === 0 (today)
          if (daysAgo === 0) {
            // Check in HR, Manager, and Emp1 today; leave Emp2 on leave, Emp3 not checked in yet
            if (u === hr || u === manager || u === emp1) {
              const checkInTime = new Date(d);
              checkInTime.setHours(9, u === emp1 ? 40 : 15, 0, 0); // Emp1 is LATE (9:40)

              await Attendance.create({
                user: u._id,
                date: dateNorm,
                checkIn: checkInTime,
                status: u === emp1 ? 'LATE' : 'PRESENT',
                notes: u === emp1 ? 'Checked in after 09:30 AM' : '',
              });
            } else if (u === emp2) {
              await Attendance.create({
                user: u._id,
                date: dateNorm,
                status: 'ON_LEAVE',
                notes: 'Approved Sick Leave',
              });
            }
          } else {
            // Past days: full check-in and check-out
            const checkInTime = new Date(d);
            checkInTime.setHours(9, daysAgo % 2 === 0 ? 10 : 25, 0);
            const checkOutTime = new Date(d);
            checkOutTime.setHours(17, 30, 0);
            const totalHours = 8.2;

            let status = 'PRESENT';
            if (daysAgo === 3 && u === emp3) {
              status = 'LATE';
            } else if (daysAgo === 2 && u === emp1) {
              status = 'ON_LEAVE';
            }

            await Attendance.create({
              user: u._id,
              date: dateNorm,
              checkIn: status === 'ON_LEAVE' ? null : checkInTime,
              checkOut: status === 'ON_LEAVE' ? null : checkOutTime,
              totalHours: status === 'ON_LEAVE' ? 0 : totalHours,
              status,
              notes: status === 'ON_LEAVE' ? 'Approved Casual Leave' : '',
            });
          }
        }
      }
    }

    console.log('[Seed] Creating Leave Requests...');
    // Approved leave for John Doe
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 3);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 2);

    await LeaveRequest.create({
      user: emp1._id,
      leaveType: 'CASUAL',
      startDate: pastStart,
      endDate: pastEnd,
      durationDays: 2,
      reason: 'Attending family wedding ceremony out of town.',
      status: 'APPROVED',
      reviewedBy: manager._id,
      reviewedAt: new Date(pastStart.getTime() - 2 * 24 * 60 * 60 * 1000),
      reviewComment: 'Approved. Please ensure pull requests are handed off.',
    });

    // Approved Sick leave for Jane Smith covering today
    const todayLeaveStart = new Date();
    const todayLeaveEnd = new Date();
    todayLeaveEnd.setDate(todayLeaveEnd.getDate() + 1);

    await LeaveRequest.create({
      user: emp2._id,
      leaveType: 'SICK',
      startDate: todayLeaveStart,
      endDate: todayLeaveEnd,
      durationDays: 2,
      reason: 'Seasonal viral flu and recovery as advised by doctor.',
      status: 'APPROVED',
      reviewedBy: hr._id,
      reviewedAt: new Date(),
      reviewComment: 'Approved. Get well soon Jane!',
    });

    // Pending Leave request from Alex Kumar (for Manager review)
    const upcomingStart = new Date();
    upcomingStart.setDate(upcomingStart.getDate() + 5);
    const upcomingEnd = new Date();
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);

    await LeaveRequest.create({
      user: emp3._id,
      leaveType: 'EARNED',
      startDate: upcomingStart,
      endDate: upcomingEnd,
      durationDays: 3,
      reason: 'Personal vacation and travel to hometown.',
      status: 'PENDING',
    });

    // Rejected leave request sample
    const rejectedStart = new Date();
    rejectedStart.setDate(rejectedStart.getDate() - 15);
    const rejectedEnd = new Date();
    rejectedEnd.setDate(rejectedEnd.getDate() - 14);

    await LeaveRequest.create({
      user: emp1._id,
      leaveType: 'CASUAL',
      startDate: rejectedStart,
      endDate: rejectedEnd,
      durationDays: 2,
      reason: 'Short notice personal errands.',
      status: 'REJECTED',
      reviewedBy: manager._id,
      reviewedAt: new Date(rejectedStart.getTime() - 24 * 60 * 60 * 1000),
      reviewComment: 'Critical production sprint release scheduled on these days.',
    });

    console.log('[Seed] Creating Company Announcements...');
    await Announcement.create([
      {
        title: 'StaffSync Annual Hackathon 2025 Announced!',
        content:
          'We are excited to announce our upcoming Hackathon on November 15th-16th. Cross-functional teams are invited to present innovative solutions in AI, HR Tech, and Automation. Exciting prizes and mentorship opportunities await!',
        author: hr._id,
        targetAudience: 'ALL',
        priority: 'HIGH',
        isPinned: true,
      },
      {
        title: 'Q4 Health and Wellness Benefits Update',
        content:
          'Employees are encouraged to review updated preventive healthcare and gym membership reimbursement policies available under People Operations.',
        author: hr._id,
        targetAudience: 'ALL',
        priority: 'MEDIUM',
        isPinned: false,
      },
      {
        title: 'Engineering Tech Talk: Microservices & Docker Migration',
        content:
          'Join the Engineering team this Thursday at 4 PM for an architectural deep dive into containerization best practices and deployment observability.',
        author: manager._id,
        targetAudience: 'Engineering',
        priority: 'MEDIUM',
        isPinned: false,
      },
      {
        title: 'Office Scheduled Server Maintenance Notice',
        content:
          'Internal network services and staging environments will undergo routine maintenance this Saturday from 10:00 PM to 2:00 AM UTC.',
        author: hr._id,
        targetAudience: 'ALL',
        priority: 'LOW',
        isPinned: false,
      },
    ]);

    console.log('[Seed] Creating Training Programs & Enrollments...');
    const tp1 = await TrainingProgram.create({
      title: 'Full Stack Modern Web Architecture & Security',
      description:
        'Comprehensive guide to designing secure REST APIs, JWT authentication, rate limiting, and React Vite optimization.',
      instructor: 'David Miller (Principal Architect)',
      category: 'TECHNICAL',
      targetAudience: 'Engineering',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30'),
      createdBy: manager._id,
    });

    const tp2 = await TrainingProgram.create({
      title: 'Workplace Ethics, Data Protection & POSH Compliance',
      description:
        'Mandatory annual workplace ethics, data confidentiality standards (GDPR/SOC2), and professional conduct training.',
      instructor: 'Legal & Compliance Team',
      category: 'COMPLIANCE',
      targetAudience: 'ALL',
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-03-31'),
      createdBy: hr._id,
    });

    const tp3 = await TrainingProgram.create({
      title: 'Agile Team Collaboration & Leadership Fundamentals',
      description:
        'Practical workshop on sprint planning, cross-functional communication, conflict resolution, and leadership.',
      instructor: 'Elena Rostova (Executive Agile Coach)',
      category: 'LEADERSHIP',
      targetAudience: 'ALL',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-05-15'),
      createdBy: hr._id,
    });

    // Enrollments
    await TrainingEnrollment.create([
      {
        trainingProgram: tp1._id,
        user: emp1._id,
        status: 'IN_PROGRESS',
        progressPercent: 65,
      },
      {
        trainingProgram: tp1._id,
        user: emp3._id,
        status: 'IN_PROGRESS',
        progressPercent: 40,
      },
      {
        trainingProgram: tp2._id,
        user: emp1._id,
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: new Date(),
      },
      {
        trainingProgram: tp2._id,
        user: emp2._id,
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: new Date(),
      },
      {
        trainingProgram: tp2._id,
        user: emp3._id,
        status: 'IN_PROGRESS',
        progressPercent: 80,
      },
      {
        trainingProgram: tp3._id,
        user: manager._id,
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: new Date(),
      },
      {
        trainingProgram: tp3._id,
        user: emp2._id,
        status: 'NOT_STARTED',
        progressPercent: 0,
      },
    ]);

    console.log('[Seed] Creating Notifications...');
    await Notification.create([
      {
        recipient: manager._id,
        title: 'New Leave Request: Alex Kumar',
        message: 'Alex Kumar has submitted a leave request for 3 days (Earned Leave).',
        type: 'LEAVE',
        link: '/leaves',
        isRead: false,
      },
      {
        recipient: emp1._id,
        title: 'Leave Request Approved',
        message: 'Your casual leave request was approved by Michael Vance.',
        type: 'LEAVE',
        link: '/leaves',
        isRead: true,
      },
      {
        recipient: emp2._id,
        title: 'Leave Request Approved',
        message: 'Your sick leave request was approved by Sarah Jenkins.',
        type: 'LEAVE',
        link: '/leaves',
        isRead: false,
      },
      {
        recipient: hr._id,
        title: 'Welcome to StaffSync Admin Console',
        message: 'StaffSync database initialized with seed records. All systems operational.',
        type: 'SYSTEM',
        link: '/dashboard',
        isRead: false,
      },
    ]);

    console.log('[Seed] Creating Audit Logs...');
    await AuditLog.create([
      {
        action: 'SYSTEM_INITIALIZED',
        performedBy: hr._id,
        details: { message: 'Initial StaffSync system seeding completed' },
      },
      {
        action: 'EMPLOYEE_CREATED',
        performedBy: hr._id,
        targetUser: emp1._id,
        details: { employeeId: 'EMP001', name: 'John Doe', department: 'Engineering' },
      },
      {
        action: 'LEAVE_APPROVED',
        performedBy: manager._id,
        targetUser: emp1._id,
        details: { leaveType: 'CASUAL', duration: 2 },
      },
    ]);

    console.log('\n======================================================');
    console.log('    STAFFSYNC DATABASE SEEDING COMPLETED SUCCESSFULLY   ');
    console.log('======================================================');
    console.log('Demo Credentials for Evaluation and Testing:');
    console.log('------------------------------------------------------');
    console.log('1. HR Administrator:');
    console.log('   Email:    hr@staffsync.com');
    console.log('   Password: StaffSync@2025');
    console.log('   Role:     HR (Full administrative rights)');
    console.log('');
    console.log('2. Engineering Manager:');
    console.log('   Email:    manager@staffsync.com');
    console.log('   Password: StaffSync@2025');
    console.log('   Role:     MANAGER (Team oversight, approvals, training)');
    console.log('');
    console.log('3. Employees:');
    console.log('   Email:    john.doe@staffsync.com');
    console.log('   Password: StaffSync@2025');
    console.log('   Role:     EMPLOYEE (Engineering - checked in today)');
    console.log('');
    console.log('   Email:    jane.smith@staffsync.com');
    console.log('   Password: StaffSync@2025');
    console.log('   Role:     EMPLOYEE (Marketing - on leave today)');
    console.log('');
    console.log('   Email:    alex.kumar@staffsync.com');
    console.log('   Password: StaffSync@2025');
    console.log('   Role:     EMPLOYEE (Engineering - pending leave)');
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
