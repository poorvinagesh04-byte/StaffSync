const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
      index: true,
    },
    reviewPeriod: {
      type: String,
      required: [true, 'Review period is required (e.g. Q1 2025)'],
      trim: true,
    },
    ratings: {
      technicalSkills: { type: Number, min: 1, max: 5, default: 4 },
      communication: { type: Number, min: 1, max: 5, default: 4 },
      punctuality: { type: Number, min: 1, max: 5, default: 4 },
      leadership: { type: Number, min: 1, max: 5, default: 4 },
      overallRating: { type: Number, min: 1, max: 5, default: 4 },
    },
    goals: [
      {
        title: { type: String, required: true },
        status: {
          type: String,
          enum: ['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'MISSED'],
          default: 'IN_PROGRESS',
        },
      },
    ],
    strengths: {
      type: String,
      trim: true,
      default: '',
    },
    improvements: {
      type: String,
      trim: true,
      default: '',
    },
    feedback: {
      type: String,
      required: [true, 'Review feedback is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

performanceReviewSchema.index({ employee: 1, reviewPeriod: 1 });
performanceReviewSchema.index({ reviewer: 1, createdAt: -1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);

