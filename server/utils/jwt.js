const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || 'staffsync_default_fallback_secret_jwt',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user);

  const cookieExpireDays = parseInt(process.env.COOKIE_EXPIRES_DAYS, 10) || 7;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      phone: user.phone || '',
      manager: user.manager || null,
      joiningDate: user.joiningDate,
      status: user.status,
      avatarUrl: user.avatarUrl || '',
      address: user.address || {},
      emergencyContact: user.emergencyContact || {},
      bio: user.bio || '',
    },
  });
};

module.exports = { generateToken, sendTokenResponse };
