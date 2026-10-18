const express = require('express');
const router = express.Router();
const {
  getTodayAttendance,
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getAllAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/today', protect, getTodayAttendance);
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my-history', protect, getMyAttendanceHistory);
router.get('/', protect, authorize('HR', 'MANAGER'), getAllAttendance);
router.get('/summary', protect, getAttendanceSummary);

module.exports = router;
