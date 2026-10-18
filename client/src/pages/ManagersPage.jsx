import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Briefcase,
  Users,
  UserCheck,
  ArrowRightLeft,
  Search,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const ManagersPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [managers, setManagers] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reassign modal state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [overviewRes, employeesRes] = await Promise.all([
        employeeAPI.getManagersOverview(),
        employeeAPI.getEmployees({ limit: 100 }),
      ]);
      setManagers(overviewRes.data.managers);
      setAllEmployees(employeesRes.data.employees);
    } catch (err) {
      console.error('Failed to fetch managers overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await employeeAPI.reassignManager({
        employeeId: selectedEmployeeId,
        newManagerId: selectedManagerId || null,
      });
      setFeedback({ type: 'success', text: 'Manager reassigned successfully!' });
      setShowReassignModal(false);
      fetchOverview();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to reassign manager',
      });
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading Managers Overview..." />;
  }

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Manage Managers & Teams</h3>
          <p className="text-muted small mb-0">
            Overview of department leadership, direct report headcounts, and organizational reporting lines.
          </p>
        </div>

        <button
          className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
          onClick={() => {
            setSelectedEmployeeId('');
            setSelectedManagerId('');
            setShowReassignModal(true);
          }}
        >
          <ArrowRightLeft size={18} /> Reassign Reporting Manager
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Managers Cards List */}
      <div className="row g-4">
        {managers.map((m) => (
          <div key={m._id} className="col-12 col-lg-6">
            <div className="card custom-card h-100 p-4">
              <div className="d-flex align-items-start justify-content-between mb-3 border-bottom pb-3">
                <div className="d-flex align-items-center gap-3">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt="Manager"
                      className="rounded-circle shadow-sm"
                      style={{ width: '54px', height: '54px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5 shadow-sm"
                      style={{ width: '54px', height: '54px' }}
                    >
                      {m.firstName?.[0]}
                    </div>
                  )}
                  <div>
                    <h5 className="fw-bold text-navy mb-0">
                      {m.firstName} {m.lastName}
                    </h5>
                    <div className="text-primary small fw-medium">{m.designation}</div>
                    <span className="text-muted small">{m.department} &bull; {m.email}</span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="badge bg-primary text-white rounded-pill px-3 py-1">
                    {m.teamSize} Direct Reports
                  </span>
                </div>
              </div>

              {/* Direct Reports List */}
              <h6 className="fw-bold text-navy small mb-2 d-flex align-items-center gap-1">
                <Users size={16} /> Direct Reports Roster ({m.teamMembers?.length || 0})
              </h6>

              {m.teamMembers?.length === 0 ? (
                <div className="p-3 bg-light rounded-3 text-muted small text-center">
                  No direct reports assigned to this manager yet.
                </div>
              ) : (
                <div className="list-group list-group-flush rounded-3 border overflow-auto" style={{ maxHeight: '200px' }}>
                  {m.teamMembers.map((report) => (
                    <div
                      key={report._id}
                      className="list-group-item d-flex align-items-center justify-content-between p-2 px-3 small"
                    >
                      <div>
                        <div className="fw-semibold text-navy">
                          {report.firstName} {report.lastName}
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {report.employeeId} &bull; {report.designation}
                        </span>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* REASSIGN MANAGER MODAL                                         */}
      {/* ============================================================== */}
      {showReassignModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Reassign Reporting Manager</h5>
                <button type="button" className="btn-close" onClick={() => setShowReassignModal(false)} />
              </div>
              <form onSubmit={handleReassignSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Employee *</label>
                    <select
                      className="form-select"
                      required
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                      <option value="">-- Choose Employee --</option>
                      {allEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">New Assigned Manager</label>
                    <select
                      className="form-select"
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                    >
                      <option value="">-- No Manager (Direct Executive) --</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.firstName} {m.lastName} ({m.department} - {m.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReassignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading || !selectedEmployeeId}>
                    {modalLoading ? 'Reassigning...' : 'Confirm Reassignment'}
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

export default ManagersPage;

