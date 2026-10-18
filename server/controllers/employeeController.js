const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');
const AuditLog = require('../models/AuditLog');

// @desc    Get all employees with pagination, search, and filters
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res, next) => {
  try {
    const {
      search,
      department,
      status,
      role,
      scope,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Manager scoping: if manager requests team scope or manager has restricted view
    if (req.user.role === 'MANAGER' && scope === 'team') {
      query.manager = req.user._id;
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Department filter
    if (department) {
      query.department = department;
    }

    // Status filter (Default active for regular employee viewing)
    if (status) {
      query.status = status;
    }

    // Search filter across firstName, lastName, email, employeeId
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { designation: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    let projection = '-password';
    // If regular employee is browsing directory, hide emergency contact / address
    if (req.user.role === 'EMPLOYEE') {
      projection = 'employeeId firstName lastName email department designation phone avatarUrl status joiningDate';
    }

    const [employees, total] = await Promise.all([
      User.find(query, projection)
        .populate('manager', 'firstName lastName email employeeId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      employees,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get eligible managers for assignment dropdowns
// @route   GET /api/employees/managers
// @access  Private (HR / Manager)
const getManagers = async (req, res, next) => {
  try {
    const managers = await User.find(
      { role: { $in: ['MANAGER', 'HR'] }, status: 'ACTIVE' },
      'firstName lastName email employeeId designation department'
    ).sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      managers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    let projection = '-password';
    if (req.user.role === 'EMPLOYEE' && req.user._id.toString() !== req.params.id) {
      // Employees viewing peer profile can only see public directory information
      projection = 'employeeId firstName lastName email department designation phone avatarUrl status joiningDate';
    }

    const employee = await User.findById(req.params.id, projection).populate(
      'manager',
      'firstName lastName email employeeId designation'
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // If manager is viewing and it's not their team and not public info
    if (
      req.user.role === 'MANAGER' &&
      employee.manager &&
      employee.manager._id.toString() !== req.user._id.toString() &&
      employee._id.toString() !== req.user._id.toString()
    ) {
      // Managers can see basic directory details for non-team members
      employee.address = undefined;
      employee.emergencyContact = undefined;
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (HR only)
const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      password,
      role = 'EMPLOYEE',
      department,
      designation,
      phone,
      manager,
      joiningDate,
      status = 'ACTIVE',
      address,
      emergencyContact,
      bio,
    } = req.body;

    // Check unique email and employeeId
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { employeeId: employeeId.toUpperCase().trim() },
      ],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase().trim() ? 'Email' : 'Employee ID';
      return res.status(400).json({
        success: false,
        message: `${field} is already in use by another account`,
      });
    }

    const newEmployee = await User.create({
      employeeId: employeeId.toUpperCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: password || 'StaffSync@2025',
      role,
      department,
      designation: designation.trim(),
      phone: phone || '',
      manager: manager || null,
      joiningDate: joiningDate || Date.now(),
      status,
      address: address || {},
      emergencyContact: emergencyContact || {},
      bio: bio || '',
    });

    // Automatically initialize current year's leave balance
    const currentYear = new Date().getFullYear();
    await LeaveBalance.findOneAndUpdate(
      { user: newEmployee._id, year: currentYear },
      {
        user: newEmployee._id,
        year: currentYear,
        casualLeave: { total: 12, used: 0 },
        sickLeave: { total: 10, used: 0 },
        earnedLeave: { total: 15, used: 0 },
        unpaidLeave: { used: 0 },
      },
      { upsert: true, new: true }
    );

    // Audit Log
    await AuditLog.create({
      action: 'EMPLOYEE_CREATED',
      performedBy: req.user._id,
      targetUser: newEmployee._id,
      details: {
        employeeId: newEmployee.employeeId,
        name: `${newEmployee.firstName} ${newEmployee.lastName}`,
        role: newEmployee.role,
        department: newEmployee.department,
      },
      ipAddress: req.ip || '',
    }).catch(() => {});

    // Return sanitized employee record
    const created = await User.findById(newEmployee._id, '-password').populate(
      'manager',
      'firstName lastName email employeeId'
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: created,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (HR only)
const updateEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      department,
      designation,
      phone,
      manager,
      joiningDate,
      status,
      address,
      emergencyContact,
      bio,
    } = req.body;

    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check email uniqueness if email changed
    if (email && email.toLowerCase().trim() !== employee.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: employee._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used by another employee',
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    if (firstName) employee.firstName = firstName.trim();
    if (lastName) employee.lastName = lastName.trim();
    if (role) employee.role = role;
    if (department) employee.department = department;
    if (designation) employee.designation = designation.trim();
    if (phone !== undefined) employee.phone = phone;
    if (manager !== undefined) employee.manager = manager || null;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (status) employee.status = status;
    if (address) employee.address = { ...employee.address, ...address };
    if (emergencyContact) employee.emergencyContact = { ...employee.emergencyContact, ...emergencyContact };
    if (bio !== undefined) employee.bio = bio;

    await employee.save();

    await AuditLog.create({
      action: 'EMPLOYEE_UPDATED',
      performedBy: req.user._id,
      targetUser: employee._id,
      details: { changes: req.body },
      ipAddress: req.ip || '',
    }).catch(() => {});

    const updated = await User.findById(employee._id, '-password').populate(
      'manager',
      'firstName lastName email employeeId'
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle employee active/inactive status
// @route   PATCH /api/employees/:id/status
// @access  Private (HR only)
const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED',
      });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    employee.status = status;
    await employee.save();

    await AuditLog.create({
      action: 'EMPLOYEE_STATUS_CHANGED',
      performedBy: req.user._id,
      targetUser: employee._id,
      details: { oldStatus: employee.status, newStatus: status },
      ipAddress: req.ip || '',
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Employee status changed to ${status}`,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        status: employee.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed manager overview for HR (teams, headcount, leaves)
// @route   GET /api/employees/managers/overview
// @access  Private (HR only)
const getManagersOverview = async (req, res, next) => {
  try {
    const managers = await User.find(
      { role: { $in: ['MANAGER', 'HR'] } },
      'firstName lastName email employeeId designation department phone avatarUrl status'
    ).sort({ firstName: 1 });

    const managerOverviews = await Promise.all(
      managers.map(async (m) => {
        const teamMembers = await User.find(
          { manager: m._id },
          'firstName lastName email employeeId designation department status avatarUrl'
        );

        return {
          ...m.toObject(),
          teamSize: teamMembers.length,
          teamMembers,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: managerOverviews.length,
      managers: managerOverviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reassign employee's manager
// @route   PUT /api/employees/reassign-manager
// @access  Private (HR only)
const reassignManager = async (req, res, next) => {
  try {
    const { employeeId, newManagerId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (newManagerId) {
      const newManager = await User.findById(newManagerId);
      if (!newManager || !['MANAGER', 'HR'].includes(newManager.role)) {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not an active manager or HR',
        });
      }
      employee.manager = newManager._id;
    } else {
      employee.manager = null;
    }

    await employee.save();

    await AuditLog.create({
      action: 'MANAGER_REASSIGNED',
      performedBy: req.user._id,
      targetUser: employee._id,
      details: { newManagerId },
      ipAddress: req.ip || '',
    }).catch(() => {});

    const updated = await User.findById(employee._id, '-password').populate(
      'manager',
      'firstName lastName email employeeId'
    );

    res.status(200).json({
      success: true,
      message: 'Manager reassigned successfully',
      employee: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmployees,
  getManagers,
  getManagersOverview,
  reassignManager,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
};

