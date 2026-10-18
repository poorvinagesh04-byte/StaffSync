const Attendance = require('../models/Attendance');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const AuditLog = require('../models/AuditLog');

// Helper: Normalize date to midnight UTC
const normalizeDate = (d = new Date()) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// @desc    Get today's attendance record for current user
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = normalizeDate();
    const record = await Attendance.findOne({ user: req.user._id, date: today });

    res.status(200).json({
      success: true,
      hasCheckedIn: !!(record && record.checkIn),
      hasCheckedOut: !!(record && record.checkOut),
      record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check-in attendance for today
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res, next) => {
  try {
    const today = normalizeDate();
    const now = new Date();

    // Find if already exists
    let record = await Attendance.findOne({ user: req.user._id, date: today });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: `You have already checked in today at ${new Date(record.checkIn).toLocaleTimeString()}`,
      });
    }

    // Determine status (LATE if checking in after 09:30 AM local time)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    const initialStatus = isLate ? 'LATE' : 'PRESENT';

    if (!record) {
      record = new Attendance({
        user: req.user._id,
        date: today,
        checkIn: now,
        status: initialStatus,
        notes: isLate ? 'Checked in after 09:30 AM' : '',
      });
    } else {
      record.checkIn = now;
      record.status = initialStatus;
    }

    await record.save();

    await AuditLog.create({
      action: 'ATTENDANCE_CHECK_IN',
      performedBy: req.user._id,
      targetUser: req.user._id,
      details: { checkInTime: now, status: record.status },
      ipAddress: req.ip || '',
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Check-in recorded at ${now.toLocaleTimeString()} (${record.status})`,
      record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check-out attendance for today
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    const today = normalizeDate();
    const now = new Date();

    const record = await Attendance.findOne({ user: req.user._id, date: today });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out without checking in first.',
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: `You have already checked out today at ${new Date(record.checkOut).toLocaleTimeString()}`,
      });
    }

    // Calculate total hours
    const diffMs = now.getTime() - new Date(record.checkIn).getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    record.checkOut = now;
    record.totalHours = hours;

    // If worked less than 4 hours, mark as HALF_DAY
    if (hours < 4 && record.status !== 'ON_LEAVE') {
      record.status = 'HALF_DAY';
      record.notes = (record.notes ? record.notes + '; ' : '') + 'Worked less than 4 hours';
    }

    await record.save();

    await AuditLog.create({
      action: 'ATTENDANCE_CHECK_OUT',
      performedBy: req.user._id,
      targetUser: req.user._id,
      details: { checkOutTime: now, totalHours: hours, status: record.status },
      ipAddress: req.ip || '',
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Check-out recorded at ${now.toLocaleTimeString()}. Total hours: ${hours} hrs`,
      record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's attendance history
// @route   GET /api/attendance/my-history
// @access  Private
const getMyAttendanceHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year, page = 1, limit = 31 } = req.query;
    const query = { user: req.user._id };

    if (startDate && endDate) {
      query.date = {
        $gte: normalizeDate(new Date(startDate)),
        $lte: normalizeDate(new Date(endDate)),
      };
    } else if (month && year) {
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0));
      query.date = { $gte: start, $lte: end };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 31;
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Attendance.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      records,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance records (for HR or Manager)
// @route   GET /api/attendance
// @access  Private (HR / Manager)
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, startDate, endDate, department, status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: normalizeDate(new Date(startDate)),
        $lte: normalizeDate(new Date(endDate)),
      };
    } else if (date) {
      query.date = normalizeDate(new Date(date));
    } else {
      query.date = normalizeDate();
    }

    if (status) {
      query.status = status;
    }

    // Role scoping: Manager only sees team members
    if (req.user.role === 'MANAGER') {
      const team = await User.find({ manager: req.user._id }, '_id');
      const teamIds = team.map((u) => u._id);
      query.user = { $in: teamIds };
    } else if (department && req.user.role === 'HR') {
      const deptUsers = await User.find({ department }, '_id');
      query.user = { $in: deptUsers.map((u) => u._id) };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('user', 'firstName lastName email employeeId department designation avatarUrl')
        .sort({ 'user.firstName': 1 })
        .skip(skip)
        .limit(limitNum),
      Attendance.countDocuments(query),
    ]);

    // Optional search filter post-populate or via user query
    let filteredRecords = records;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filteredRecords = records.filter(
        (r) =>
          r.user &&
          (regex.test(r.user.firstName) ||
            regex.test(r.user.lastName) ||
            regex.test(r.user.email) ||
            regex.test(r.user.employeeId))
      );
    }

    res.status(200).json({
      success: true,
      date: targetDate,
      count: filteredRecords.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      records: filteredRecords,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance summary statistics
// @route   GET /api/attendance/summary
// @access  Private
const getAttendanceSummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? normalizeDate(new Date(date)) : normalizeDate();

    let userQuery = { status: 'ACTIVE' };
    if (req.user.role === 'MANAGER') {
      userQuery.manager = req.user._id;
    }

    const totalActiveEmployees = await User.countDocuments(userQuery);
    const users = await User.find(userQuery, '_id');
    const userIds = users.map((u) => u._id);

    const attendanceRecords = await Attendance.find({
      date: targetDate,
      user: { $in: userIds },
    });

    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
    const halfDayCount = attendanceRecords.filter((r) => r.status === 'HALF_DAY').length;
    const onLeaveCount = attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const totalCheckedIn = presentCount + lateCount + halfDayCount;
    const absentCount = Math.max(0, totalActiveEmployees - (totalCheckedIn + onLeaveCount));

    res.status(200).json({
      success: true,
      date: date
  ? normalizeDate(new Date(date))
  : startDate && endDate
    ? null
    : normalizeDate(),
      totalEmployees: totalActiveEmployees,
      totalCheckedIn,
      presentCount,
      lateCount,
      halfDayCount,
      onLeaveCount,
      absentCount,
      attendanceRate:
        totalActiveEmployees > 0
          ? Math.round((totalCheckedIn / totalActiveEmployees) * 100)
          : 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTodayAttendance,
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getAllAttendance,
  getAttendanceSummary,
};
