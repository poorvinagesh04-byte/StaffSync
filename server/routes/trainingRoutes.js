const express = require('express');
const router = express.Router();
const {
  getTrainingPrograms,
  getTrainingById,
  createTrainingProgram,
  assignTraining,
  updateMyProgress,
  deleteTrainingProgram,
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getTrainingPrograms);
router.get('/:id', protect, getTrainingById);
router.post('/', protect, authorize('HR', 'MANAGER'), createTrainingProgram);
router.post('/:id/assign', protect, authorize('HR', 'MANAGER'), assignTraining);
router.patch('/:id/progress', protect, updateMyProgress);
router.delete('/:id', protect, authorize('HR', 'MANAGER'), deleteTrainingProgram);

module.exports = router;
