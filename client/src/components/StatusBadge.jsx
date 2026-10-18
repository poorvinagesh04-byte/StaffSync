import React from 'react';

const statusConfig = {
  // Employment
  ACTIVE: { bg: 'bg-success-subtle text-success border border-success-subtle', label: 'Active' },
  INACTIVE: { bg: 'bg-secondary-subtle text-secondary border border-secondary-subtle', label: 'Inactive' },
  SUSPENDED: { bg: 'bg-danger-subtle text-danger border border-danger-subtle', label: 'Suspended' },

  // Attendance
  PRESENT: { bg: 'bg-success-subtle text-success border border-success-subtle', label: 'Present' },
  LATE: { bg: 'bg-warning-subtle text-warning border border-warning-subtle', label: 'Late' },
  HALF_DAY: { bg: 'bg-info-subtle text-info border border-info-subtle', label: 'Half Day' },
  ON_LEAVE: { bg: 'bg-primary-subtle text-primary border border-primary-subtle', label: 'On Leave' },
  ABSENT: { bg: 'bg-danger-subtle text-danger border border-danger-subtle', label: 'Absent' },

  // Leaves
  PENDING: { bg: 'bg-warning-subtle text-warning border border-warning-subtle', label: 'Pending' },
  APPROVED: { bg: 'bg-success-subtle text-success border border-success-subtle', label: 'Approved' },
  REJECTED: { bg: 'bg-danger-subtle text-danger border border-danger-subtle', label: 'Rejected' },
  CANCELLED: { bg: 'bg-secondary-subtle text-secondary border border-secondary-subtle', label: 'Cancelled' },

  // Roles
  HR: { bg: 'bg-primary text-white', label: 'HR Admin' },
  MANAGER: { bg: 'bg-info text-white', label: 'Manager' },
  EMPLOYEE: { bg: 'bg-secondary text-white', label: 'Employee' },

  // Priorities
  LOW: { bg: 'bg-secondary-subtle text-secondary', label: 'Low' },
  MEDIUM: { bg: 'bg-info-subtle text-info', label: 'Medium' },
  HIGH: { bg: 'bg-warning-subtle text-warning', label: 'High' },
  URGENT: { bg: 'bg-danger-subtle text-danger', label: 'Urgent' },

  // Training
  NOT_STARTED: { bg: 'bg-secondary-subtle text-secondary', label: 'Not Started' },
  IN_PROGRESS: { bg: 'bg-primary-subtle text-primary', label: 'In Progress' },
  COMPLETED: { bg: 'bg-success-subtle text-success', label: 'Completed' },
};

const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;
  const config = statusConfig[status.toUpperCase()] || {
    bg: 'bg-light text-dark',
    label: status,
  };

  return (
    <span className={`badge-status ${config.bg} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;

