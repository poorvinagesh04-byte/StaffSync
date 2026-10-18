const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getManagers,
  getManagersOverview,
  reassignManager,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getEmployees);
router.get('/managers/overview', protect, authorize('HR'), getManagersOverview);
router.get('/managers', protect, authorize('HR', 'MANAGER'), getManagers);
router.put('/reassign-manager', protect, authorize('HR'), reassignManager);
router.get('/:id', protect, getEmployeeById);
router.post('/', protect, authorize('HR'), createEmployee);
router.put('/:id', protect, authorize('HR'), updateEmployee);
router.patch('/:id/status', protect, authorize('HR'), updateEmployeeStatus);

module.exports = router;
