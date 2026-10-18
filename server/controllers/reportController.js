const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const TrainingProgram = require('../models/TrainingProgram');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Announcement = require('../models/Announcement');
const AuditLog = require('../models/AuditLog');

const normalizeDate = (d = new Date()) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// @desc    Get aggregated dashboard statistics based on user role
// @route   GET /api/reports/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const today = normalizeDate();
    const role = req.user.role;
    const currentYear = new Date().getFullYear();

    if (role === 'HR') {
      const [
        totalEmployees,
        activeEmployees,
        todayAttendance,
        pendingLeaves,
        deptAgg,
        recentActivities,
        trainingsCount,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'ACTIVE' }),
        Attendance.find({ date: today }),
        LeaveRequest.countDocuments({ status: 'PENDING' }),
        User.aggregate([
          { $match: { status: 'ACTIVE' } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        AuditLog.find()
          .populate('performedBy', 'firstName lastName email role')
          .sort({ createdAt: -1 })
          .limit(8),
        TrainingProgram.countDocuments(),
      ]);

      const presentCount = todayAttendance.filter((a) =>
        ['PRESENT', 'LATE'].includes(a.status)
      ).length;
      const onLeaveCount = todayAttendance.filter((a) => a.status === 'ON_LEAVE').length;
      const lateCount = todayAttendance.filter((a) => a.status === 'LATE').length;

      // Department breakdown formatting
      const departmentStats = deptAgg.map((d) => ({
        name: d._id || 'Unassigned',
        value: d.count,
      }));

      // Weekly trend: past 7 days attendance
      const past7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const norm = normalizeDate(d);
        past7Days.push(norm);
      }

      const trendRecords = await Attendance.find({
        date: { $in: past7Days },
      });

      const weeklyTrend = past7Days.map((d) => {
        const dayRecords = trendRecords.filter(
          (r) => r.date.getTime() === d.getTime()
        );
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return {
          date: dayStr,
          present: dayRecords.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length,
          late: dayRecords.filter((r) => r.status === 'LATE').length,
          onLeave: dayRecords.filter((r) => r.status === 'ON_LEAVE').length,
        };
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalEmployees,
          activeEmployees,
          presentToday: presentCount,
          lateToday: lateCount,
          onLeaveToday: onLeaveCount,
          pendingLeaves,
          trainingsCount,
          departmentStats,
          weeklyTrend,
          recentActivities,
        },
      });
    }

    if (role === 'MANAGER') {
      const teamUsers = await User.find({ manager: req.user._id, status: 'ACTIVE' });
      const teamUserIds = teamUsers.map((u) => u._id);

      const [teamAttendance, pendingLeaves, teamEnrollments] = await Promise.all([
        Attendance.find({ date: today, user: { $in: teamUserIds } }),
        LeaveRequest.find({ user: { $in: teamUserIds }, status: 'PENDING' })
          .populate('user', 'firstName lastName email designation employeeId')
          .sort({ createdAt: -1 }),
        TrainingEnrollment.find({ user: { $in: teamUserIds } }),
      ]);

      const teamPresent = teamAttendance.filter((a) =>
        ['PRESENT', 'LATE'].includes(a.status)
      ).length;
      const teamOnLeave = teamAttendance.filter((a) => a.status === 'ON_LEAVE').length;
      const teamCompletedTrainings = teamEnrollments.filter(
        (e) => e.status === 'COMPLETED'
      ).length;

      return res.status(200).json({
        success: true,
        stats: {
          teamSize: teamUsers.length,
          teamPresentToday: teamPresent,
          teamOnLeaveToday: teamOnLeave,
          pendingLeavesCount: pendingLeaves.length,
          pendingLeavesList: pendingLeaves.slice(0, 5),
          teamTrainingCount: teamEnrollments.length,
          teamTrainingCompleted: teamCompletedTrainings,
          teamMembers: teamUsers.map((u) => ({
            _id: u._id,
            fullName: u.fullName,
            designation: u.designation,
            email: u.email,
            avatarUrl: u.avatarUrl,
          })),
        },
      });
    }

    // EMPLOYEE role
    const [balance, todayAtt, myLeaves, myEnrollments, latestAnnouncements] =
      await Promise.all([
        LeaveBalance.findOne({ user: req.user._id, year: currentYear }),
        Attendance.findOne({ user: req.user._id, date: today }),
        LeaveRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
        TrainingEnrollment.find({ user: req.user._id }).populate('trainingProgram'),
        Announcement.find({
          targetAudience: { $in: ['ALL', req.user.department] },
        })
          .sort({ isPinned: -1, createdAt: -1 })
          .limit(3),
      ]);

    const activeTrainings = myEnrollments.filter(
      (e) => e.status !== 'COMPLETED'
    ).length;
    const completedTrainings = myEnrollments.filter(
      (e) => e.status === 'COMPLETED'
    ).length;

    return res.status(200).json({
      success: true,
      stats: {
        leaveBalance: balance || {
          casualLeave: { total: 12, used: 0 },
          sickLeave: { total: 10, used: 0 },
          earnedLeave: { total: 15, used: 0 },
          unpaidLeave: { used: 0 },
        },
        todayAttendance: todayAtt,
        recentLeaves: myLeaves,
        activeTrainingsCount: activeTrainings,
        completedTrainingsCount: completedTrainings,
        recentAnnouncements: latestAnnouncements,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export employee directory as CSV
// @route   GET /api/reports/export/employees
// @access  Private (HR / Manager)
const exportEmployeesCSV = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'MANAGER') {
      query.manager = req.user._id;
    }

    const employees = await User.find(query)
      .populate('manager', 'firstName lastName')
      .sort({ employeeId: 1 });

    let csv = 'Employee ID,First Name,Last Name,Email,Phone,Department,Designation,Role,Manager,Joining Date,Status\n';

    employees.forEach((emp) => {
      const managerName = emp.manager
        ? `"${emp.manager.firstName} ${emp.manager.lastName}"`
        : 'N/A';
      const joinDate = emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '';
      csv += `"${emp.employeeId}","${emp.firstName}","${emp.lastName}","${emp.email}","${emp.phone || ''}","${emp.department}","${emp.designation}","${emp.role}",${managerName},"${joinDate}","${emp.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staffsync_employees.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

// @desc    Export attendance as CSV
// @route   GET /api/reports/export/attendance
// @access  Private (HR / Manager)
const exportAttendanceCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: normalizeDate(new Date(startDate)),
        $lte: normalizeDate(new Date(endDate)),
      };
    }

    if (req.user.role === 'MANAGER') {
      const team = await User.find({ manager: req.user._id }, '_id');
      query.user = { $in: team.map((u) => u._id) };
    } else if (department && req.user.role === 'HR') {
      const deptUsers = await User.find({ department }, '_id');
      query.user = { $in: deptUsers.map((u) => u._id) };
    }

    const records = await Attendance.find(query)
      .populate('user', 'employeeId firstName lastName department designation')
      .sort({ date: -1 });

    let csv = 'Date,Employee ID,Employee Name,Department,Designation,Check-In,Check-Out,Total Hours,Status,Notes\n';

    records.forEach((rec) => {
      if (!rec.user) return;
      const dateStr = rec.date ? new Date(rec.date).toISOString().split('T')[0] : '';
      const checkInStr = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : 'N/A';
      const checkOutStr = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : 'N/A';
      const name = `"${rec.user.firstName} ${rec.user.lastName}"`;
      csv += `"${dateStr}","${rec.user.employeeId}",${name},"${rec.user.department}","${rec.user.designation}","${checkInStr}","${checkOutStr}",${rec.totalHours || 0},"${rec.status}","${rec.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staffsync_attendance.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

// @desc    Export leave requests as CSV
// @route   GET /api/reports/export/leaves
// @access  Private (HR / Manager)
const exportLeavesCSV = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'MANAGER') {
      const team = await User.find({ manager: req.user._id }, '_id');
      query.user = { $in: team.map((u) => u._id) };
    }

    const leaves = await LeaveRequest.find(query)
      .populate('user', 'employeeId firstName lastName department')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    let csv = 'Request ID,Employee ID,Employee Name,Department,Leave Type,Start Date,End Date,Duration (Days),Status,Reason,Reviewed By,Review Date\n';

    leaves.forEach((l) => {
      if (!l.user) return;
      const startStr = l.startDate ? new Date(l.startDate).toISOString().split('T')[0] : '';
      const endStr = l.endDate ? new Date(l.endDate).toISOString().split('T')[0] : '';
      const reviewer = l.reviewedBy ? `"${l.reviewedBy.firstName} ${l.reviewedBy.lastName}"` : 'Pending';
      const reviewDate = l.reviewedAt ? new Date(l.reviewedAt).toISOString().split('T')[0] : 'N/A';
      const empName = `"${l.user.firstName} ${l.user.lastName}"`;
      csv += `"${l._id}","${l.user.employeeId}",${empName},"${l.user.department}","${l.leaveType}","${startStr}","${endStr}",${l.durationDays},"${l.status}","${(l.reason || '').replace(/"/g, '""')}",${reviewer},"${reviewDate}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staffsync_leaves.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  exportEmployeesCSV,
  exportAttendanceCSV,
  exportLeavesCSV,
};
