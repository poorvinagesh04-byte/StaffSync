import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Award,
  PlusCircle,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  User,
  Users,
} from 'lucide-react';
import { performanceAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PerformancePage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const canReview = isHR || isManager;

  const [loading, setLoading] = useState(true);
  const [myMetrics, setMyMetrics] = useState(null);
  const [teamSummaries, setTeamSummaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewTab, setViewTab] = useState(canReview ? 'team' : 'my_summary');

  // Review modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewPeriod: 'Q1 2025',
    overallRating: 4.5,
    technicalSkills: 4,
    communication: 4,
    punctuality: 5,
    leadership: 4,
    goals: [
      { title: 'Deliver core system milestones on schedule', status: 'ACHIEVED' },
      { title: 'Mentor junior engineers and lead architecture sessions', status: 'IN_PROGRESS' },
    ],
    strengths: '',
    improvements: '',
    feedback: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const myRes = await performanceAPI.getMyPerformance();
      setMyMetrics(myRes.data.metrics);

      if (canReview) {
        const [teamRes, empRes] = await Promise.all([
          performanceAPI.getTeamPerformance(),
          employeeAPI.getEmployees({ limit: 100 }),
        ]);
        setTeamSummaries(teamRes.data.summaries);
        setEmployees(empRes.data.employees);
      }
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setFormError('');
      await performanceAPI.createPerformanceReview({
        employeeId: reviewForm.employeeId,
        reviewPeriod: reviewForm.reviewPeriod,
        ratings: {
          overallRating: reviewForm.overallRating,
          technicalSkills: reviewForm.technicalSkills,
          communication: reviewForm.communication,
          punctuality: reviewForm.punctuality,
          leadership: reviewForm.leadership,
        },
        goals: reviewForm.goals,
        strengths: reviewForm.strengths,
        improvements: reviewForm.improvements,
        feedback: reviewForm.feedback,
      });

      setFeedback({ type: 'success', text: 'Performance appraisal recorded successfully!' });
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Employee Performance & Metrics</h3>
          <p className="text-muted small mb-0">
            Attendance consistency scores, continuous upskilling rates, and quarterly appraisals.
          </p>
        </div>

        {canReview && (
          <button
            className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              setFormError('');
              setShowCreateModal(true);
            }}
          >
            <PlusCircle size={18} /> New Performance Review
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* View Switcher if Privileged */}
      {canReview && (
        <div className="mb-4">
          <div className="btn-group p-1 bg-light rounded-3">
            <button
              className={`btn btn-sm ${viewTab === 'team' ? 'btn-primary' : 'btn-light'} rounded-2 px-3`}
              onClick={() => setViewTab('team')}
            >
              Team Performance Roster
            </button>
            <button
              className={`btn btn-sm ${viewTab === 'my_summary' ? 'btn-primary' : 'btn-light'} rounded-2 px-3`}
              onClick={() => setViewTab('my_summary')}
            >
              My Personal Performance
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Calculating performance indices..." />
      ) : viewTab === 'team' && canReview ? (
        /* Team Performance Roster */
        <div className="row g-4">
          {teamSummaries.length === 0 ? (
            <div className="col-12">
              <div className="card custom-card p-5 text-center text-muted">
                <Users size={48} className="mx-auto mb-3 text-secondary opacity-50" />
                <h5>No team members available for performance evaluation</h5>
              </div>
            </div>
          ) : (
            teamSummaries.map((summary) => (
              <div key={summary.employee._id} className="col-12 col-md-6 col-xl-4">
                <div className="card custom-card h-100 p-4">
                  <div className="d-flex align-items-center gap-3 mb-3 border-bottom pb-3">
                    {summary.employee.avatarUrl ? (
                      <img
                        src={summary.employee.avatarUrl}
                        alt="Employee"
                        className="rounded-circle shadow-sm"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5" style={{ width: '48px', height: '48px' }}>
                        {summary.employee.firstName?.[0]}
                      </div>
                    )}
                    <div>
                      <h6 className="fw-bold text-navy mb-0">
                        {summary.employee.firstName} {summary.employee.lastName}
                      </h6>
                      <span className="text-muted small">
                        {summary.employee.designation} &bull; {summary.employee.department}
                      </span>
                    </div>
                  </div>

                  <div className="row g-2 mb-3 text-center">
                    <div className="col-4">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>RATING</span>
                        <div className="fw-bold text-primary fs-5">{summary.avgRating} / 5</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>PUNCTUALITY</span>
                        <div className="fw-bold text-success fs-5">{summary.punctualityScore}%</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>TRAINING</span>
                        <div className="fw-bold text-info fs-5">{summary.trainingScore}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="small text-muted mb-3">
                    Total Reviews Completed: <strong>{summary.totalReviews}</strong>
                  </div>

                  <button
                    className="btn btn-outline-primary btn-sm w-100 rounded-pill mt-auto"
                    onClick={() => {
                      setReviewForm({ ...reviewForm, employeeId: summary.employee._id });
                      setShowCreateModal(true);
                    }}
                  >
                    Conduct Appraisal
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Personal Summary View */
        myMetrics && (
          <div>
            {/* Top Stat Gauges */}
            <div className="row g-3 g-xl-4 mb-4">
              <div className="col-12 col-md-4">
                <div className="card custom-card p-4 text-center">
                  <div className="stat-icon-wrapper bg-warning bg-opacity-10 text-warning mx-auto mb-2">
                    <Star size={24} />
                  </div>
                  <span className="text-muted small fw-medium">Overall Appraisal Score</span>
                  <h2 className="fw-bold text-navy my-1">{myMetrics.avgRating} <span className="fs-6 text-muted fw-normal">/ 5.0</span></h2>
                  <span className="text-muted small">Across all performance reviews</span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card custom-card p-4 text-center">
                  <div className="stat-icon-wrapper bg-success bg-opacity-10 text-success mx-auto mb-2">
                    <Clock size={24} />
                  </div>
                  <span className="text-muted small fw-medium">Punctuality & Attendance</span>
                  <h2 className="fw-bold text-success my-1">{myMetrics.punctualityScore}%</h2>
                  <span className="text-muted small">On-time check-in consistency</span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card custom-card p-4 text-center">
                  <div className="stat-icon-wrapper bg-info bg-opacity-10 text-info mx-auto mb-2">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-muted small fw-medium">Curriculum Completion</span>
                  <h2 className="fw-bold text-info my-1">{myMetrics.trainingScore}%</h2>
                  <span className="text-muted small">Completed assigned programs</span>
                </div>
              </div>
            </div>

            {/* Performance Reviews History */}
            <div className="card custom-card p-4">
              <h6 className="fw-bold text-navy mb-3">Performance Appraisals History</h6>
              {myMetrics.reviews?.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                  No performance appraisals have been submitted for your account yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {myMetrics.reviews.map((rev) => (
                    <div key={rev._id} className="p-3 border rounded-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary text-white rounded-pill px-3 py-1">
                          {rev.reviewPeriod}
                        </span>
                        <div className="d-flex align-items-center text-warning fw-bold small gap-1">
                          <Star size={16} fill="#f59e0b" /> {rev.ratings?.overallRating || 4.5} / 5.0
                        </div>
                      </div>

                      <p className="small text-navy mb-2 fw-medium">"{rev.feedback}"</p>

                      <div className="row g-2 small text-muted">
                        {rev.strengths && (
                          <div className="col-md-6">
                            <strong>Key Strengths:</strong> {rev.strengths}
                          </div>
                        )}
                        {rev.improvements && (
                          <div className="col-md-6">
                            <strong>Growth Areas:</strong> {rev.improvements}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ============================================================== */}
      {/* CREATE PERFORMANCE REVIEW MODAL                                */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Submit Performance Review</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
              </div>
              <form onSubmit={handleCreateReview}>
                <div className="modal-body py-3">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Select Employee *</label>
                      <select
                        className="form-select"
                        required
                        value={reviewForm.employeeId}
                        onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Review Period *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Q1 2025 or Annual 2024"
                        value={reviewForm.reviewPeriod}
                        onChange={(e) => setReviewForm({ ...reviewForm, reviewPeriod: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 mb-3">
                    <span className="fw-bold small text-navy d-block mb-2">Rating Metrics (1 to 5)</span>
                    <div className="row g-2">
                      <div className="col-6 col-md-3">
                        <label className="form-label small text-muted">Overall (1-5)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          className="form-control"
                          value={reviewForm.overallRating}
                          onChange={(e) => setReviewForm({ ...reviewForm, overallRating: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small text-muted">Technical (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="form-control"
                          value={reviewForm.technicalSkills}
                          onChange={(e) => setReviewForm({ ...reviewForm, technicalSkills: parseInt(e.target.value, 10) })}
                        />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small text-muted">Communication (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="form-control"
                          value={reviewForm.communication}
                          onChange={(e) => setReviewForm({ ...reviewForm, communication: parseInt(e.target.value, 10) })}
                        />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small text-muted">Punctuality (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="form-control"
                          value={reviewForm.punctuality}
                          onChange={(e) => setReviewForm({ ...reviewForm, punctuality: parseInt(e.target.value, 10) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Key Strengths</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. High attention to detail, proactive mentor"
                      value={reviewForm.strengths}
                      onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Areas for Growth</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cross-functional documentation"
                      value={reviewForm.improvements}
                      onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Overall Evaluator Feedback *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      placeholder="Comprehensive feedback on contribution..."
                      value={reviewForm.feedback}
                      onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading || !reviewForm.employeeId}>
                    {modalLoading ? 'Saving...' : 'Publish Appraisal'}
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

export default PerformancePage;

