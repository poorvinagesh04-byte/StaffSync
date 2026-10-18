import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  BellRing,
  PlusCircle,
  Pin,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { announcementAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const AnnouncementsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const canPost = isHR || isManager;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    priority: 'MEDIUM',
    isPinned: false,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementAPI.getAnnouncements();
      setAnnouncements(res.data.announcements);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setFormError('');
      await announcementAPI.createAnnouncement(postForm);
      setFeedback({ type: 'success', text: 'Announcement published successfully!' });
      setShowPostModal(false);
      setPostForm({
        title: '',
        content: '',
        targetAudience: 'ALL',
        priority: 'MEDIUM',
        isPinned: false,
      });
      fetchAnnouncements();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementAPI.deleteAnnouncement(id);
      setFeedback({ type: 'info', text: 'Announcement deleted.' });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Company Announcements</h3>
          <p className="text-muted small mb-0">
            Official communications, company updates, and departmental notices.
          </p>
        </div>

        {canPost && (
          <button
            className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              setFormError('');
              setShowPostModal(true);
            }}
          >
            <PlusCircle size={18} /> Post Announcement
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <BellRing size={48} className="mx-auto mb-3 text-secondary opacity-50" />
          <h5>No announcements posted yet</h5>
          <p className="small mb-0">Check back later for important company updates.</p>
        </div>
      ) : (
        <div className="row g-4">
          {announcements.map((item) => (
            <div key={item._id} className="col-12">
              <div
                className={`card custom-card p-4 position-relative ${
                  item.isPinned ? 'border-primary border-2 shadow-sm' : ''
                }`}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    {item.isPinned && (
                      <span className="badge bg-primary text-white d-flex align-items-center gap-1 rounded-pill px-2 py-1 small">
                        <Pin size={12} /> Pinned
                      </span>
                    )}
                    <StatusBadge status={item.priority} />
                    <span className="badge bg-light text-navy border small">
                      Audience: {item.targetAudience}
                    </span>
                  </div>

                  <div className="text-muted small d-flex align-items-center gap-3">
                    <span className="d-flex align-items-center gap-1">
                      <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {(isHR || item.author?._id === user?._id) && (
                      <button
                        className="btn btn-sm btn-outline-danger border-0 p-1 rounded-2"
                        onClick={() => handleDelete(item._id)}
                        title="Delete Announcement"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h5 className="fw-bold text-navy mb-2">{item.title}</h5>
                <p className="text-muted mb-3 lh-base" style={{ whiteSpace: 'pre-line' }}>
                  {item.content}
                </p>

                <div className="d-flex align-items-center gap-2 pt-2 border-top text-muted small">
                  <User size={14} />
                  <span>
                    Posted by{' '}
                    <strong>
                      {item.author?.firstName} {item.author?.lastName}
                    </strong>{' '}
                    ({item.author?.designation || item.author?.role})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* POST ANNOUNCEMENT MODAL                                        */}
      {/* ============================================================== */}
      {showPostModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Publish Announcement</h5>
                <button type="button" className="btn-close" onClick={() => setShowPostModal(false)} />
              </div>
              <form onSubmit={handlePostSubmit}>
                <div className="modal-body py-3">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Annual Townhall & Hackathon 2025"
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Target Audience</label>
                      <select
                        className="form-select"
                        value={postForm.targetAudience}
                        onChange={(e) => setPostForm({ ...postForm, targetAudience: e.target.value })}
                      >
                        <option value="ALL">Entire Company (ALL)</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Priority Level</label>
                      <select
                        className="form-select"
                        value={postForm.priority}
                        onChange={(e) => setPostForm({ ...postForm, priority: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Content *</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      required
                      placeholder="Type the full announcement message..."
                      value={postForm.content}
                      onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    />
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="pinCheck"
                      checked={postForm.isPinned}
                      onChange={(e) => setPostForm({ ...postForm, isPinned: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="pinCheck">
                      Pin this announcement to top of the dashboard and list
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPostModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
                    {modalLoading ? 'Publishing...' : 'Publish Announcement'}
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

export default AnnouncementsPage;

