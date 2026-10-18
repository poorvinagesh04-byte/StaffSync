const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Helper: Calculate inclusive days between two dates
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
};

// Helper: Get or initialize leave balance for a user and year
const getOrCreateBalance = async (userId, year = new Date().getFullYear()) => {
  let balance = await LeaveBalance.findOne({ user: userId, year });
  if (!balance) {
    balance = await LeaveBalance.create({
      user: userId,
      year,
      casualLeave: { total: 12, used: 0 },
      sickLeave: { total: 10, used: 0 },
      earnedLeave: { total: 15, used: 0 },
      unpaidLeave: { used: 0 },
    });
  }
  return balance;
};

// @desc    Get current user's leave balances
// @route   GET /api/leaves/balances
// @access  Private
const getMyBalances = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const balance = await getOrCreateBalance(req.user._id, year);

    res.status(200).json({
      success: true,
      balance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get leave balance of a specific user
// @route   GET /api/leaves/balances/:userId
// @access  Private (HR or direct Manager)
const getBalancesByUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization check
    if (
      req.user.role !== 'HR' &&
      targetUser.manager?.toString() !== req.user._id.toString() &&
      req.user._id.toString() !== targetUserId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this employee balance',
      });
    }

    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const balance = await getOrCreateBalance(targetUserId, year);

    res.status(200).json({
      success: true,
      balance,
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        employeeId: targetUser.employeeId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Apply for leave
// @route   POST /api/leaves/apply
// @access  Private
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide leave type, start date, end date, and reason',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end date provided',
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date',
      });
    }

    const durationDays = calculateDuration(start, end);
    if (durationDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Leave duration must be at least 1 day',
      });
    }

    // Check for overlapping PENDING or APPROVED leave requests
    const overlapping = await LeaveRequest.findOne({
      user: req.user._id,
      status: { $in: ['PENDING', 'APPROVED'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `You already have an existing ${overlapping.status.toLowerCase()} leave request for overlapping dates (${new Date(
          overlapping.startDate
        ).toLocaleDateString()} to ${new Date(overlapping.endDate).toLocaleDateString()}).`,
      });
    }

    // Check balance for paid leave types
    const leaveYear = start.getFullYear();
    const balance = await getOrCreateBalance(req.user._id, leaveYear);

    if (leaveType === 'CASUAL') {
      const remaining = balance.casualLeave.total - balance.casualLeave.used;
      if (remaining < durationDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient casual leave balance. Remaining: ${remaining} days, Requested: ${durationDays} days.`,
        });
      }
    } else if (leaveType === 'SICK') {
      const remaining = balance.sickLeave.total - balance.sickLeave.used;
      if (remaining < durationDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient sick leave balance. Remaining: ${remaining} days, Requested: ${durationDays} days.`,
        });
      }
    } else if (leaveType === 'EARNED') {
      const remaining = balance.earnedLeave.total - balance.earnedLeave.used;
      if (remaining < durationDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient earned leave balance. Remaining: ${remaining} days, Requested: ${durationDays} days.`,
        });
      }
    }

    const leaveRequest = await LeaveRequest.create({
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      durationDays,
      reason: reason.trim(),
      status: 'PENDING',
    });

    // Notify manager or HR
    const managerId = req.user.manager;
    if (managerId) {
      await Notification.create({
        recipient: managerId,
        title: 'New Leave Request',
        message: `${req.user.fullName} applied for ${durationDays} day(s) of ${leaveType.toLowerCase()} leave.`,
        type: 'LEAVE',
        link: '/leaves',
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leaveRequest,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's leave requests
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('reviewedBy', 'firstName lastName email designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LeaveRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      leaves,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel a pending leave request
// @route   PATCH /api/leaves/:id/cancel
// @access  Private
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a leave request that is already ${leave.status.toLowerCase()}`,
      });
    }

    leave.status = 'CANCELLED';
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all leave requests (for HR or Manager)
// @route   GET /api/leaves
// @access  Private (HR / Manager)
const getLeaveRequests = async (req, res, next) => {
  try {
    const { status, leaveType, department, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    // If Manager: only fetch leave requests of direct reports
    if (req.user.role === 'MANAGER') {
      const directReports = await User.find({ manager: req.user._id }, '_id');
      const directReportIds = directReports.map((u) => u._id);
      query.user = { $in: directReportIds };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // If department filter is passed and role is HR
    if (department && req.user.role === 'HR') {
      const deptUsers = await User.find({ department }, '_id');
      const deptUserIds = deptUsers.map((u) => u._id);
      if (query.user) {
        // Intersect
      } else {
        query.user = { $in: deptUserIds };
      }
    }

    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('user', 'firstName lastName email employeeId department designation avatarUrl manager')
        .populate('reviewedBy', 'firstName lastName email designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LeaveRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      leaves,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Review (Approve/Reject) leave request
// @route   PATCH /api/leaves/:id/review
// @access  Private (HR / Manager)
const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { status, reviewComment = '' } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either APPROVED or REJECTED',
      });
    }

    const leave = await LeaveRequest.findById(req.params.id).populate('user');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Leave request has already been ${leave.status.toLowerCase()}`,
      });
    }

    // Role verification: Manager can only review direct reports
    if (req.user.role === 'MANAGER') {
      if (!leave.user.manager || leave.user.manager.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only review leave requests for your direct reports',
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = reviewComment.trim();
    await leave.save();

    // If APPROVED, update leave balance and attendance records
    if (status === 'APPROVED') {
      const year = leave.startDate.getFullYear();
      const balance = await getOrCreateBalance(leave.user._id, year);

      if (leave.leaveType === 'CASUAL') {
        balance.casualLeave.used += leave.durationDays;
      } else if (leave.leaveType === 'SICK') {
        balance.sickLeave.used += leave.durationDays;
      } else if (leave.leaveType === 'EARNED') {
        balance.earnedLeave.used += leave.durationDays;
      } else if (leave.leaveType === 'UNPAID') {
        balance.unpaidLeave.used += leave.durationDays;
      }
      await balance.save();

      // Mark Attendance dates as ON_LEAVE
      const cur = new Date(leave.startDate);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate);
      end.setHours(0, 0, 0, 0);

      while (cur <= end) {
        // Skip weekends (Saturday=6, Sunday=0) for standard workweek if desired
        const dayOfWeek = cur.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await Attendance.findOneAndUpdate(
            { user: leave.user._id, date: new Date(cur) },
            {
              user: leave.user._id,
              date: new Date(cur),
              status: 'ON_LEAVE',
              notes: `${leave.leaveType} leave approved`,
            },
            { upsert: true }
          );
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Notify employee
    await Notification.create({
      recipient: leave.user._id,
      title: `Leave Request ${status}`,
      message: `Your ${leave.leaveType.toLowerCase()} leave request for ${new Date(
        leave.startDate
      ).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} was ${status.toLowerCase()} by ${
        req.user.fullName
      }.${reviewComment ? ` Note: "${reviewComment}"` : ''}`,
      type: 'LEAVE',
      link: '/leaves',
    }).catch(() => {});

    // Audit Log
    await AuditLog.create({
      action: `LEAVE_${status}`,
      performedBy: req.user._id,
      targetUser: leave.user._id,
      details: {
        leaveId: leave._id,
        leaveType: leave.leaveType,
        duration: leave.durationDays,
        status,
        reviewComment,
      },
      ipAddress: req.ip || '',
    }).catch(() => {});

    const updatedLeave = await LeaveRequest.findById(leave._id)
      .populate('user', 'firstName lastName email employeeId department designation')
      .populate('reviewedBy', 'firstName lastName email designation');

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave: updatedLeave,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyBalances,
  getBalancesByUser,
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getLeaveRequests,
  reviewLeaveRequest,
};
