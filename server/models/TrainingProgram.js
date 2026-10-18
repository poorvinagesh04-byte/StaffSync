const mongoose = require('mongoose');

const trainingProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['TECHNICAL', 'COMPLIANCE', 'LEADERSHIP', 'ONBOARDING', 'SOFT_SKILLS', 'GENERAL'],
      default: 'TECHNICAL',
    },
    targetAudience: {
      type: String,
      default: 'ALL',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

trainingProgramSchema.index({ category: 1, startDate: -1 });

module.exports = mongoose.model('TrainingProgram', trainingProgramSchema);
