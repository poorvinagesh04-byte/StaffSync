const TrainingProgram = require('../models/TrainingProgram');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Get training programs
// @route   GET /api/training
// @access  Private
const getTrainingPrograms = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { instructor: searchRegex }];
    }

    const programs = await TrainingProgram.find(query)
      .populate('createdBy', 'firstName lastName email designation')
      .sort({ startDate: -1 });

    // Fetch enrollments for each program
    const programIds = programs.map((p) => p._id);
    const enrollments = await TrainingEnrollment.find({
      trainingProgram: { $in: programIds },
    }).populate('user', 'firstName lastName email department avatarUrl employeeId');

    // Attach enrollment metrics and user's own enrollment
    const programsWithDetails = programs.map((p) => {
      const pDoc = p.toObject();
      const pEnrollments = enrollments.filter(
        (e) => e.trainingProgram.toString() === p._id.toString()
      );

      pDoc.totalEnrolled = pEnrollments.length;
      pDoc.completedCount = pEnrollments.filter((e) => e.status === 'COMPLETED').length;
      pDoc.inProgressCount = pEnrollments.filter((e) => e.status === 'IN_PROGRESS').length;

      // Find current user's enrollment
      const myEnrollment = pEnrollments.find(
        (e) => e.user && e.user._id.toString() === req.user._id.toString()
      );

      pDoc.myEnrollment = myEnrollment || null;
      return pDoc;
    });

    res.status(200).json({
      success: true,
      count: programsWithDetails.length,
      programs: programsWithDetails,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single training program details with enrollments
// @route   GET /api/training/:id
// @access  Private
const getTrainingById = async (req, res, next) => {
  try {
    const program = await TrainingProgram.findById(req.params.id).populate(
      'createdBy',
      'firstName lastName email designation'
    );

    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    let enrollmentQuery = { trainingProgram: program._id };
    // If Manager, filter enrollments to team members
    if (req.user.role === 'MANAGER') {
      const team = await User.find({ manager: req.user._id }, '_id');
      const teamIds = team.map((u) => u._id);
      enrollmentQuery.user = { $in: teamIds };
    }

    const enrollments = await TrainingEnrollment.find(enrollmentQuery)
      .populate('user', 'firstName lastName email employeeId department designation avatarUrl')
      .sort({ progressPercent: -1 });

    const myEnrollment = await TrainingEnrollment.findOne({
      trainingProgram: program._id,
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      program,
      enrollments,
      myEnrollment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new training program
// @route   POST /api/training
// @access  Private (HR / Manager)
const createTrainingProgram = async (req, res, next) => {
  try {
    const {
      title,
      description,
      instructor,
      category = 'TECHNICAL',
      targetAudience = 'ALL',
      startDate,
      endDate,
    } = req.body;

    if (!title || !description || !instructor || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields for the training program',
      });
    }

    const program = await TrainingProgram.create({
      title: title.trim(),
      description: description.trim(),
      instructor: instructor.trim(),
      category,
      targetAudience,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user._id,
    });

    await AuditLog.create({
      action: 'TRAINING_PROGRAM_CREATED',
      performedBy: req.user._id,
      details: { title, instructor, category },
      ipAddress: req.ip || '',
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      program,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign employees to training program
// @route   POST /api/training/:id/assign
// @access  Private (HR / Manager)
const assignTraining = async (req, res, next) => {
  try {
    const { userIds, department } = req.body;
    const program = await TrainingProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    let targetUserIds = [];

    if (department) {
      const usersInDept = await User.find({ department, status: 'ACTIVE' }, '_id');
      targetUserIds = usersInDept.map((u) => u._id);
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide user IDs or a department to assign training',
      });
    }

    // Role check for Manager: can only assign to their team members
    if (req.user.role === 'MANAGER') {
      const teamMembers = await User.find({ manager: req.user._id }, '_id');
      const teamMemberIds = teamMembers.map((m) => m._id.toString());
      targetUserIds = targetUserIds.filter((id) => teamMemberIds.includes(id.toString()));
    }

    let assignedCount = 0;
    const notifications = [];

    for (const uId of targetUserIds) {
      const existing = await TrainingEnrollment.findOne({
        trainingProgram: program._id,
        user: uId,
      });

      if (!existing) {
        await TrainingEnrollment.create({
          trainingProgram: program._id,
          user: uId,
          status: 'NOT_STARTED',
          progressPercent: 0,
        });
        assignedCount++;

        notifications.push({
          recipient: uId,
          title: `Assigned Training: ${program.title}`,
          message: `You have been enrolled in "${program.title}" by ${req.user.fullName}.`,
          type: 'TRAINING',
          link: '/training',
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Successfully enrolled ${assignedCount} employee(s) into ${program.title}`,
      assignedCount,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update employee's own training progress
// @route   PATCH /api/training/:id/progress
// @access  Private
const updateMyProgress = async (req, res, next) => {
  try {
    const { status, progressPercent } = req.body;

    let enrollment = await TrainingEnrollment.findOne({
      trainingProgram: req.params.id,
      user: req.user._id,
    });

    // If not formally enrolled yet, create enrollment
    if (!enrollment) {
      enrollment = new TrainingEnrollment({
        trainingProgram: req.params.id,
        user: req.user._id,
        status: 'NOT_STARTED',
        progressPercent: 0,
      });
    }

    if (status) {
      enrollment.status = status;
    }

    if (progressPercent !== undefined) {
      const p = Math.min(100, Math.max(0, parseInt(progressPercent, 10)));
      enrollment.progressPercent = p;
      if (p === 100) {
        enrollment.status = 'COMPLETED';
        enrollment.completedAt = new Date();
      } else if (p > 0 && enrollment.status === 'NOT_STARTED') {
        enrollment.status = 'IN_PROGRESS';
      }
    }

    if (enrollment.status === 'COMPLETED' && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.progressPercent = 100;
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Training progress updated successfully',
      enrollment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete training program
// @route   DELETE /api/training/:id
// @access  Private (HR / Manager creator)
const deleteTrainingProgram = async (req, res, next) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    if (req.user.role !== 'HR' && program.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this training program',
      });
    }

    await TrainingEnrollment.deleteMany({ trainingProgram: program._id });
    await TrainingProgram.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Training program deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTrainingPrograms,
  getTrainingById,
  createTrainingProgram,
  assignTraining,
  updateMyProgress,
  deleteTrainingProgram,
};
