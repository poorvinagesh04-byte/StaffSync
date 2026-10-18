const PerformanceReview = require('../models/PerformanceReview');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Helper: compute performance analytics for an employee
const computeEmployeeMetrics = async (userId) => {
  // 1. Attendance consistency: past 30 days present/late vs total work days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const attendanceRecords = await Attendance.find({
    user: userId,
    date: { $gte: thirtyDaysAgo },
  });

  const presentDays = attendanceRecords.filter((a) =>
    ['PRESENT', 'LATE'].includes(a.status)
  ).length;
  const onTimeDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const punctualityScore =
    presentDays > 0 ? Math.round((onTimeDays / presentDays) * 100) : 100;

  // 2. Training completion
  const enrollments = await TrainingEnrollment.find({ user: userId });
  const totalTrainings = enrollments.length;
  const completedTrainings = enrollments.filter((e) => e.status === 'COMPLETED').length;
  const trainingScore =
    totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 100;

  // 3. Performance reviews average
  const reviews = await PerformanceReview.find({ employee: userId }).sort({
    createdAt: -1,
  });

  let avgRating = 0;
  if (reviews.length > 0) {
    const totalOverall = reviews.reduce(
      (sum, r) => sum + (r.ratings?.overallRating || 4),
      0
    );
    avgRating = Math.round((totalOverall / reviews.length) * 10) / 10;
  } else {
    avgRating = 4.2; // Baseline
  }

  return {
    punctualityScore,
    trainingScore,
    avgRating,
    totalReviews: reviews.length,
    reviews,
  };
};

// @desc    Get current user's performance summary
// @route   GET /api/performance/my-summary
// @access  Private
const getMyPerformance = async (req, res, next) => {
  try {
    const metrics = await computeEmployeeMetrics(req.user._id);

    res.status(200).json({
      success: true,
      metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get team members' performance summary (for Manager)
// @route   GET /api/performance/team
// @access  Private (Manager / HR)
const getTeamPerformance = async (req, res, next) => {
  try {
    let query = { status: 'ACTIVE' };
    if (req.user.role === 'MANAGER') {
      query.manager = req.user._id;
    }

    const team = await User.find(query, 'firstName lastName email employeeId department designation avatarUrl');

    const summaries = await Promise.all(
      team.map(async (member) => {
        const metrics = await computeEmployeeMetrics(member._id);
        return {
          employee: member,
          ...metrics,
        };
      })
    );

    res.status(200).json({
      success: true,
      summaries,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get employee performance details by ID
// @route   GET /api/performance/employee/:id
// @access  Private (HR / Manager of employee)
const getEmployeePerformance = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (
      req.user.role !== 'HR' &&
      target.manager?.toString() !== req.user._id.toString() &&
      req.user._id.toString() !== target._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this performance report',
      });
    }

    const metrics = await computeEmployeeMetrics(target._id);

    res.status(200).json({
      success: true,
      employee: {
        _id: target._id,
        fullName: target.fullName,
        email: target.email,
        employeeId: target.employeeId,
        department: target.department,
        designation: target.designation,
      },
      metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new performance review
// @route   POST /api/performance
// @access  Private (HR / Manager)
const createPerformanceReview = async (req, res, next) => {
  try {
    const {
      employeeId,
      reviewPeriod,
      ratings,
      goals,
      strengths,
      improvements,
      feedback,
    } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (
      req.user.role === 'MANAGER' &&
      employee.manager?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only submit reviews for direct reports',
      });
    }

    const review = await PerformanceReview.create({
      employee: employee._id,
      reviewer: req.user._id,
      reviewPeriod,
      ratings: ratings || { overallRating: 4 },
      goals: goals || [],
      strengths: strengths || '',
      improvements: improvements || '',
      feedback,
    });

    // Notify employee
    await Notification.create({
      recipient: employee._id,
      title: 'New Performance Review Published',
      message: `${req.user.fullName} completed your performance appraisal for ${reviewPeriod}.`,
      type: 'SYSTEM',
      link: '/profile',
    }).catch(() => {});

    await AuditLog.create({
      action: 'PERFORMANCE_REVIEW_CREATED',
      performedBy: req.user._id,
      targetUser: employee._id,
      details: { reviewPeriod, overallRating: ratings?.overallRating || 4 },
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Performance review recorded successfully',
      review,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPerformance,
  getTeamPerformance,
  getEmployeePerformance,
  createPerformanceReview,
};

