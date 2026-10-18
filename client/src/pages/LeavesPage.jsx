import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  CalendarCheck,
  PlusCircle,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Info,
  Calendar,
} from 'lucide-react';
import { leaveAPI, reportAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const LeavesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const isPrivileged = isHR || isManager;

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [leavesList, setLeavesList] = useState([]);
  const [activeTab, setActiveTab] = useState(isPrivileged ? 'review' : 'my_leaves');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Apply leave form
  const [applyForm, setApplyForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Review leave form
  const [reviewForm, setReviewForm] = useState({
    status: 'APPROVED',
    reviewComment: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const balanceRes = await leaveAPI.getMyBalances();
      setBalance(balanceRes.data.balance);

      if (isPrivileged && activeTab === 'review') {
        const res = await leaveAPI.getLeaveRequests({
          status: statusFilter,
          limit: 50,
        });
        setLeavesList(res.data.leaves);
      } else {
        const res = await leaveAPI.getMyLeaves({
          status: statusFilter,
          limit: 50,
        });
        setLeavesList(res.data.leaves);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  // Calculate live duration in days
  const calculateDuration = () => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setFormError('');
      await leaveAPI.applyLeave(applyForm);
      setFeedback({ type: 'success', text: 'Leave request submitted successfully!' });
      setShowApplyModal(false);
      setApplyForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await leaveAPI.cancelLeave(id);
      setFeedback({ type: 'info', text: 'Leave request cancelled.' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await leaveAPI.reviewLeaveRequest(selectedLeave._id, reviewForm);
      setFeedback({
        type: 'success',
        text: `Leave request ${reviewForm.status.toLowerCase()} successfully!`,
      });
      setShowReviewModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review leave request');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await reportAPI.exportLeavesCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'staffsync_leaves.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  const calculatedDays = calculateDuration();

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Leave Management</h3>
          <p className="text-muted small mb-0">
            Track annual quotas, submit leave requests, and manage approval workflows.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              setFormError('');
              setShowApplyModal(true);
            }}
          >
            <PlusCircle size={18} /> Apply for Leave
          </button>
          {isPrivileged && (
            <button
              className="btn btn-outline-secondary px-3 py-2 rounded-3 d-flex align-items-center gap-2"
              onClick={handleExportCSV}
            >
              <Download size={18} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Leave Balances Cards */}
      {balance && (
        <div className="row g-3 g-xl-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card custom-card p-3 h-100 border-start border-4 border-primary">
              <span className="text-muted small fw-medium">Casual Leave</span>
              <h3 className="fw-bold text-primary my-1">
                {balance.casualLeave.total - balance.casualLeave.used} <span className="fs-6 text-muted fw-normal">days left</span>
              </h3>
              <div className="text-muted small">
                Used: {balance.casualLeave.used} / {balance.casualLeave.total}
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card custom-card p-3 h-100 border-start border-4 border-info">
              <span className="text-muted small fw-medium">Sick Leave</span>
              <h3 className="fw-bold text-info my-1">
                {balance.sickLeave.total - balance.sickLeave.used} <span className="fs-6 text-muted fw-normal">days left</span>
              </h3>
              <div className="text-muted small">
                Used: {balance.sickLeave.used} / {balance.sickLeave.total}
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card custom-card p-3 h-100 border-start border-4 border-success">
              <span className="text-muted small fw-medium">Earned Leave</span>
              <h3 className="fw-bold text-success my-1">
                {balance.earnedLeave.total - balance.earnedLeave.used} <span className="fs-6 text-muted fw-normal">days left</span>
              </h3>
              <div className="text-muted small">
                Used: {balance.earnedLeave.used} / {balance.earnedLeave.total}
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card custom-card p-3 h-100 border-start border-4 border-secondary">
              <span className="text-muted small fw-medium">Unpaid Leave</span>
              <h3 className="fw-bold text-secondary my-1">
                {balance.unpaidLeave?.used || 0} <span className="fs-6 text-muted fw-normal">days taken</span>
              </h3>
              <div className="text-muted small">Deducted on payroll</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Review vs Personal) */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
        <ul className="nav nav-pills bg-light p-1 rounded-3">
          {isPrivileged && (
            <li className="nav-item">
              <button
                className={`nav-link py-1 px-3 rounded-2 fw-medium small ${
                  activeTab === 'review' ? 'active bg-primary' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('review')}
              >
                Approvals Queue ({isHR ? 'Company Wide' : 'My Direct Reports'})
              </button>
            </li>
          )}
          <li className="nav-item">
            <button
              className={`nav-link py-1 px-3 rounded-2 fw-medium small ${
                activeTab === 'my_leaves' ? 'active bg-primary' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('my_leaves')}
            >
              My Leave Requests
            </button>
          </li>
        </ul>

        {/* Status Filter */}
        <div style={{ width: '180px' }}>
          <select
            className="form-select form-select-sm shadow-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Loading leave applications..." />
      ) : leavesList.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <CalendarCheck size={48} className="mx-auto mb-3 text-secondary opacity-50" />
          <h5>No leave records found</h5>
          <p className="small mb-0">No applications match your selected filter.</p>
        </div>
      ) : (
        <div className="card custom-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  {activeTab === 'review' && <th>Applicant</th>}
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Dates Range</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer / Notes</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.map((item) => (
                  <tr key={item._id}>
                    {activeTab === 'review' && (
                      <td>
                        <div className="fw-semibold text-navy">
                          {item.user?.firstName} {item.user?.lastName}
                        </div>
                        <span className="text-muted small">
                          {item.user?.employeeId} &bull; {item.user?.department}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className="badge bg-light text-navy border small">
                        {item.leaveType}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-navy">{item.durationDays}</span> day(s)
                    </td>
                    <td className="small text-muted">
                      {new Date(item.startDate).toLocaleDateString()} &rarr;{' '}
                      {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="small text-muted" style={{ maxWidth: '220px' }}>
                      {item.reason}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="small text-muted">
                      {item.reviewedBy ? (
                        <div>
                          <span className="fw-medium">
                            {item.reviewedBy.firstName} {item.reviewedBy.lastName}
                          </span>
                          {item.reviewComment && (
                            <div className="fst-italic">"{item.reviewComment}"</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Awaiting Review</span>
                      )}
                    </td>
                    <td className="text-end">
                      {activeTab === 'review' && item.status === 'PENDING' && (
                        <button
                          className="btn btn-sm btn-primary px-3 rounded-pill"
                          onClick={() => {
                            setSelectedLeave(item);
                            setReviewForm({ status: 'APPROVED', reviewComment: '' });
                            setShowReviewModal(true);
                          }}
                        >
                          Review
                        </button>
                      )}

                      {activeTab === 'my_leaves' && item.status === 'PENDING' && (
                        <button
                          className="btn btn-sm btn-outline-danger px-3 rounded-pill"
                          onClick={() => handleCancelLeave(item._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* APPLY FOR LEAVE MODAL                                          */}
      {/* ============================================================== */}
      {showApplyModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Apply for Leave</h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)} />
              </div>
              <form onSubmit={handleApplySubmit}>
                <div className="modal-body py-3">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Leave Type *</label>
                    <select
                      className="form-select"
                      value={applyForm.leaveType}
                      onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                    >
                      <option value="CASUAL">Casual Leave ({balance ? balance.casualLeave.total - balance.casualLeave.used : 0} days left)</option>
                      <option value="SICK">Sick Leave ({balance ? balance.sickLeave.total - balance.sickLeave.used : 0} days left)</option>
                      <option value="EARNED">Earned Leave ({balance ? balance.earnedLeave.total - balance.earnedLeave.used : 0} days left)</option>
                      <option value="UNPAID">Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={applyForm.startDate}
                        onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={applyForm.endDate}
                        onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {calculatedDays > 0 && (
                    <div className="p-2 mb-3 bg-light rounded-3 small text-muted d-flex align-items-center justify-content-between">
                      <span>Calculated Duration:</span>
                      <strong className="text-primary fs-6">{calculatedDays} day(s)</strong>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Reason for Absence *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      placeholder="Please provide concise justification for leave..."
                      value={applyForm.reason}
                      onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading || calculatedDays <= 0}>
                    {modalLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REVIEW LEAVE MODAL (HR / Manager)                              */}
      {/* ============================================================== */}
      {showReviewModal && selectedLeave && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Review Leave Application</h5>
                <button type="button" className="btn-close" onClick={() => setShowReviewModal(false)} />
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body py-3">
                  <div className="p-3 bg-light rounded-3 mb-3 small">
                    <div className="fw-bold text-navy mb-1">
                      {selectedLeave.user?.firstName} {selectedLeave.user?.lastName} ({selectedLeave.user?.employeeId})
                    </div>
                    <div className="text-muted">
                      {selectedLeave.leaveType} Leave &bull; {selectedLeave.durationDays} day(s)
                    </div>
                    <div className="text-muted mb-2">
                      {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <strong>Reason:</strong> {selectedLeave.reason}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Decision</label>
                    <select
                      className="form-select"
                      value={reviewForm.status}
                      onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                    >
                      <option value="APPROVED">Approve Leave</option>
                      <option value="REJECTED">Reject Leave</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Reviewer Comment (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Approved. Please hand over pending tasks."
                      value={reviewForm.reviewComment}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewComment: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-${reviewForm.status === 'APPROVED' ? 'success' : 'danger'} px-4`}
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Processing...' : `Confirm ${reviewForm.status}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;

