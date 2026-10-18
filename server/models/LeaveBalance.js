const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
      required: true,
    },
    casualLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
    },
    sickLeave: {
      total: { type: Number, default: 10 },
      used: { type: Number, default: 0 },
    },
    earnedLeave: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
    },
    unpaidLeave: {
      used: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one leave balance record per employee per year
leaveBalanceSchema.index({ user: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
