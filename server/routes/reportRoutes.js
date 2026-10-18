const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  exportEmployeesCSV,
  exportAttendanceCSV,
  exportLeavesCSV,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/export/employees', protect, authorize('HR', 'MANAGER'), exportEmployeesCSV);
router.get('/export/attendance', protect, authorize('HR', 'MANAGER'), exportAttendanceCSV);
router.get('/export/leaves', protect, authorize('HR', 'MANAGER'), exportLeavesCSV);

module.exports = router;
