const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get announcements visible to current user
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const query = {};

    // HR can view all, employees/managers view ALL + their department
    if (req.user.role !== 'HR') {
      query.targetAudience = { $in: ['ALL', req.user.department] };
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'firstName lastName email designation role avatarUrl')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (HR / Manager)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience = 'ALL', priority = 'MEDIUM', isPinned = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for announcement',
      });
    }

    // Role check: If Manager, can only publish to their department or ALL
    if (req.user.role === 'MANAGER' && targetAudience !== 'ALL' && targetAudience !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Managers can only publish announcements to 'ALL' or '${req.user.department}'`,
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user._id,
      targetAudience,
      priority,
      isPinned: !!isPinned,
    });

    // Notify relevant users
    const userQuery = { status: 'ACTIVE' };
    if (targetAudience !== 'ALL') {
      userQuery.department = targetAudience;
    }

    const targetUsers = await User.find(userQuery, '_id');
    const notifications = targetUsers
      .filter((u) => u._id.toString() !== req.user._id.toString())
      .map((u) => ({
        recipient: u._id,
        title: `New Announcement: ${title}`,
        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        type: 'ANNOUNCEMENT',
        link: '/announcements',
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications).catch(() => {});
    }

    await AuditLog.create({
      action: 'ANNOUNCEMENT_CREATED',
      performedBy: req.user._id,
      details: { title, targetAudience, priority },
      ipAddress: req.ip || '',
    }).catch(() => {});

    const created = await Announcement.findById(announcement._id).populate(
      'author',
      'firstName lastName email designation role avatarUrl'
    );

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      announcement: created,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (HR / Author)
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user.role !== 'HR' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this announcement',
      });
    }

    const { title, content, targetAudience, priority, isPinned } = req.body;
    if (title) announcement.title = title.trim();
    if (content) announcement.content = content.trim();
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (priority) announcement.priority = priority;
    if (isPinned !== undefined) announcement.isPinned = isPinned;

    await announcement.save();

    const updated = await Announcement.findById(announcement._id).populate(
      'author',
      'firstName lastName email designation role avatarUrl'
    );

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (HR / Author)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user.role !== 'HR' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this announcement',
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
