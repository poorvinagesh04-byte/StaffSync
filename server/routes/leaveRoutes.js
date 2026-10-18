const express = require('express');
const router = express.Router();
const {
  getMyBalances,
  getBalancesByUser,
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getLeaveRequests,
  reviewLeaveRequest,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.get('/balances', protect, getMyBalances);
router.get('/balances/:userId', protect, authorize('HR', 'MANAGER'), getBalancesByUser);
router.post('/apply', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.patch('/:id/cancel', protect, cancelLeave);
router.get('/', protect, authorize('HR', 'MANAGER'), getLeaveRequests);
router.patch('/:id/review', protect, authorize('HR', 'MANAGER'), reviewLeaveRequest);

module.exports = router;
