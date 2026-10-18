import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  GraduationCap,
  PlusCircle,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  UserCheck,
  Edit,
  Trash2,
  BookOpen,
  UserPlus,
} from 'lucide-react';
import { trainingAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = ['TECHNICAL', 'COMPLIANCE', 'LEADERSHIP', 'ONBOARDING', 'SOFT_SKILLS', 'GENERAL'];

const TrainingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const canManage = isHR || isManager;

  const [programs, setPrograms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Create form
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    instructor: '',
    category: 'TECHNICAL',
    targetAudience: 'ALL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Assign form
  const [assignDept, setAssignDept] = useState('');
  const [assignUserIds, setAssignUserIds] = useState([]);

  // Progress form
  const [progressForm, setProgressForm] = useState({
    status: 'IN_PROGRESS',
    progressPercent: 50,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await trainingAPI.getTrainingPrograms({ category: categoryFilter });
      setPrograms(res.data.programs);

      if (canManage) {
        const empRes = await employeeAPI.getEmployees({ limit: 100 });
        setEmployees(empRes.data.employees);
      }
    } catch (err) {
      console.error('Failed to load training programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setFormError('');
      await trainingAPI.createTrainingProgram(createForm);
      setFeedback({ type: 'success', text: 'Training program created successfully!' });
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create training program');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await trainingAPI.assignTraining(selectedProgram._id, {
        department: assignDept || undefined,
        userIds: assignUserIds.length > 0 ? assignUserIds : undefined,
      });
      setFeedback({ type: 'success', text: 'Employees enrolled successfully!' });
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign training');
    } finally {
      setModalLoading(false);
    }
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await trainingAPI.updateMyProgress(selectedProgram._id, progressForm);
      setFeedback({ type: 'success', text: 'Progress updated successfully!' });
      setShowProgressModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training program?')) return;
    try {
      await trainingAPI.deleteTrainingProgram(id);
      setFeedback({ type: 'info', text: 'Training program removed.' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete program');
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Training & Development Programs</h3>
          <p className="text-muted small mb-0">
            Upskilling curricula, corporate compliance trainings, and individual learning progress tracking.
          </p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              setFormError('');
              setShowCreateModal(true);
            }}
          >
            <PlusCircle size={18} /> Create Program
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Category Filters */}
      <div className="d-flex align-items-center gap-2 mb-4 overflow-auto pb-1">
        <button
          className={`btn btn-sm rounded-pill px-3 ${!categoryFilter ? 'btn-primary' : 'btn-light border'}`}
          onClick={() => setCategoryFilter('')}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm rounded-pill px-3 ${categoryFilter === cat ? 'btn-primary' : 'btn-light border'}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading training modules..." />
      ) : programs.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <GraduationCap size={48} className="mx-auto mb-3 text-secondary opacity-50" />
          <h5>No training programs found</h5>
          <p className="small mb-0">Select another category or create a new training module.</p>
        </div>
      ) : (
        <div className="row g-4">
          {programs.map((prog) => {
            const myEnrollment = prog.myEnrollment;
            const progress = myEnrollment?.progressPercent || 0;

            return (
              <div key={prog._id} className="col-12 col-md-6 col-xl-4">
                <div className="card custom-card h-100 p-4 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-primary-subtle text-primary small">
                      {prog.category}
                    </span>
                    {canManage && (
                      <button
                        className="btn btn-sm btn-link text-danger p-0 border-0"
                        onClick={() => handleDelete(prog._id)}
                        title="Delete Program"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <h5 className="fw-bold text-navy mb-2">{prog.title}</h5>
                  <p className="text-muted small mb-3 flex-grow-1" style={{ minHeight: '40px' }}>
                    {prog.description}
                  </p>

                  <div className="p-2 px-3 bg-light rounded-3 small text-muted mb-3">
                    <div className="mb-1">
                      <strong>Instructor:</strong> {prog.instructor}
                    </div>
                    <div>
                      <strong>Dates:</strong> {new Date(prog.startDate).toLocaleDateString()} to{' '}
                      {new Date(prog.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Personal Progress Bar for employee */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center small mb-1">
                      <span className="fw-medium text-navy">Your Progress:</span>
                      <span className="fw-bold text-primary">{progress}%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                    <div className="mt-1 d-flex justify-content-between align-items-center">
                      <StatusBadge status={myEnrollment?.status || 'NOT_STARTED'} />
                      <button
                        className="btn btn-sm btn-link text-primary p-0 text-decoration-none small"
                        onClick={() => {
                          setSelectedProgram(prog);
                          setProgressForm({
                            status: myEnrollment?.status || 'IN_PROGRESS',
                            progressPercent: myEnrollment?.progressPercent || 25,
                          });
                          setShowProgressModal(true);
                        }}
                      >
                        Update Progress &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Manager/HR Enrolled Counts Footer */}
                  {canManage && (
                    <div className="pt-3 border-top d-flex align-items-center justify-content-between mt-auto">
                      <span className="text-muted small d-flex align-items-center gap-1">
                        <Users size={14} /> {prog.totalEnrolled || 0} Enrolled ({prog.completedCount || 0} Finished)
                      </span>
                      <button
                        className="btn btn-sm btn-outline-primary px-3 rounded-pill d-flex align-items-center gap-1"
                        onClick={() => {
                          setSelectedProgram(prog);
                          setAssignDept('');
                          setAssignUserIds([]);
                          setShowAssignModal(true);
                        }}
                      >
                        <UserPlus size={14} /> Enroll Team
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* CREATE PROGRAM MODAL                                           */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Create Training Program</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body py-3">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Program Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Modern Cloud Native Architecture"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Instructor Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Dr. Alex Mercer"
                        value={createForm.instructor}
                        onChange={(e) => setCreateForm({ ...createForm, instructor: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={createForm.category}
                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={createForm.startDate}
                        onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={createForm.endDate}
                        onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Program Curriculum & Description *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      required
                      placeholder="Details, prerequisites, learning outcomes..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
                    {modalLoading ? 'Creating...' : 'Create Program'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ASSIGN TRAINING MODAL                                          */}
      {/* ============================================================== */}
      {showAssignModal && selectedProgram && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">
                  Enroll Team in: {selectedProgram.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)} />
              </div>
              <form onSubmit={handleAssignSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Assign Entire Department</label>
                    <select
                      className="form-select"
                      value={assignDept}
                      onChange={(e) => {
                        setAssignDept(e.target.value);
                        setAssignUserIds([]);
                      }}
                    >
                      <option value="">-- Or Choose Specific Employees Below --</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  {!assignDept && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Select Employee(s)</label>
                      <select
                        multiple
                        className="form-select"
                        style={{ height: '150px' }}
                        value={assignUserIds}
                        onChange={(e) => {
                          const options = Array.from(e.target.selectedOptions, (item) => item.value);
                          setAssignUserIds(options);
                        }}
                      >
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.department})
                          </option>
                        ))}
                      </select>
                      <span className="text-muted small">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</span>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading || (!assignDept && assignUserIds.length === 0)}>
                    {modalLoading ? 'Enrolling...' : 'Confirm Enrollment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* UPDATE PROGRESS MODAL                                          */}
      {/* ============================================================== */}
      {showProgressModal && selectedProgram && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Update Training Progress</h5>
                <button type="button" className="btn-close" onClick={() => setShowProgressModal(false)} />
              </div>
              <form onSubmit={handleProgressSubmit}>
                <div className="modal-body py-3">
                  <h6 className="fw-bold text-navy mb-3">{selectedProgram.title}</h6>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={progressForm.status}
                      onChange={(e) => {
                        const s = e.target.value;
                        setProgressForm({
                          status: s,
                          progressPercent: s === 'COMPLETED' ? 100 : s === 'NOT_STARTED' ? 0 : 50,
                        });
                      }}
                    >
                      <option value="NOT_STARTED">Not Started (0%)</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed (100%)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold d-flex justify-content-between">
                      <span>Progress Completion</span>
                      <strong className="text-primary">{progressForm.progressPercent}%</strong>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="100"
                      step="5"
                      value={progressForm.progressPercent}
                      onChange={(e) =>
                        setProgressForm({
                          ...progressForm,
                          progressPercent: parseInt(e.target.value, 10),
                          status:
                            parseInt(e.target.value, 10) === 100
                              ? 'COMPLETED'
                              : parseInt(e.target.value, 10) === 0
                              ? 'NOT_STARTED'
                              : 'IN_PROGRESS',
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowProgressModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
                    {modalLoading ? 'Saving...' : 'Save Progress'}
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

export default TrainingPage;

