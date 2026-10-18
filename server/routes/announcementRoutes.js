const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('HR', 'MANAGER'), createAnnouncement);
router.put('/:id', protect, authorize('HR', 'MANAGER'), updateAnnouncement);
router.delete('/:id', protect, authorize('HR', 'MANAGER'), deleteAnnouncement);

module.exports = router;
