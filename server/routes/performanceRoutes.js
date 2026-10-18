const express = require('express');
const router = express.Router();
const {
  getMyPerformance,
  getTeamPerformance,
  getEmployeePerformance,
  createPerformanceReview,
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-summary', protect, getMyPerformance);
router.get('/team', protect, authorize('MANAGER', 'HR'), getTeamPerformance);
router.get('/employee/:id', protect, getEmployeePerformance);
router.post('/', protect, authorize('HR', 'MANAGER'), createPerformanceReview);

module.exports = router;

