const mongoose = require('mongoose');

const trainingEnrollmentSchema = new mongoose.Schema(
  {
    trainingProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate enrollment for the same user in the same training program
trainingEnrollmentSchema.index({ trainingProgram: 1, user: 1 }, { unique: true });
trainingEnrollmentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);
