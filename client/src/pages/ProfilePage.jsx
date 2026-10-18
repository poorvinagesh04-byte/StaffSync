import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Shield,
  Lock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Save,
  Briefcase,
} from 'lucide-react';
import { authAPI } from '../services/api';
import { updateUserState } from '../store/authSlice';
import StatusBadge from '../components/StatusBadge';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'employment', 'security'
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Personal profile form state
  const [profileForm, setProfileForm] = useState({
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    bio: '',
  });

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zip: user.address?.zip || '',
        country: user.address?.country || '',
        emergencyName: user.emergencyContact?.name || '',
        emergencyRelation: user.emergencyContact?.relationship || '',
        emergencyPhone: user.emergencyContact?.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setFeedback(null);
      const updates = {
        phone: profileForm.phone,
        bio: profileForm.bio,
        address: {
          street: profileForm.street,
          city: profileForm.city,
          state: profileForm.state,
          zip: profileForm.zip,
          country: profileForm.country,
        },
        emergencyContact: {
          name: profileForm.emergencyName,
          relationship: profileForm.emergencyRelation,
          phone: profileForm.emergencyPhone,
        },
      };

      const res = await authAPI.updateProfile(updates);
      dispatch(updateUserState(res.data.user));
      setFeedback({ type: 'success', text: 'Personal details updated successfully!' });
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to update personal details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'danger', text: 'New password and confirmation do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setFeedback({ type: 'danger', text: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setFeedback({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to change password. Verify your current password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Profile Header Hero */}
      <div className="card custom-card p-4 mb-4 border-0 shadow-sm">
        <div className="d-flex flex-column flex-md-row align-items-center gap-4">
          <div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="rounded-circle shadow"
                style={{ width: '90px', height: '90px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-2 shadow"
                style={{ width: '90px', height: '90px' }}
              >
                {user?.firstName?.[0]}
              </div>
            )}
          </div>

          <div className="text-center text-md-start flex-grow-1">
            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
              <h3 className="fw-bold text-navy mb-0">{user?.fullName}</h3>
              <StatusBadge status={user?.role} />
              <StatusBadge status={user?.status} />
            </div>
            <div className="text-primary fw-medium small mb-1">{user?.designation} &bull; {user?.department}</div>
            <div className="text-muted small">
              Employee ID: <strong>{user?.employeeId}</strong> &bull; Corporate Email: <strong>{user?.email}</strong>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Tabs Menu */}
      <div className="mb-4">
        <ul className="nav nav-pills bg-light p-1 rounded-3">
          <li className="nav-item">
            <button
              className={`nav-link py-2 px-4 rounded-2 fw-medium small ${
                activeTab === 'personal' ? 'active bg-primary' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              Personal & Contact Information
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-2 px-4 rounded-2 fw-medium small ${
                activeTab === 'employment' ? 'active bg-primary' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('employment')}
            >
              Employment Details
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-2 px-4 rounded-2 fw-medium small ${
                activeTab === 'security' ? 'active bg-primary' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('security')}
            >
              Security & Credentials
            </button>
          </li>
        </ul>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'personal' && (
        <div className="card custom-card p-4">
          <h5 className="fw-bold text-navy mb-3">Edit Permitted Personal Details</h5>
          <form onSubmit={handleProfileSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+1 (555) 000-0000"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Street Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 100 Main Street, Suite 400"
                  value={profileForm.street}
                  onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">City</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">State / Province</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Postal / ZIP Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.zip}
                  onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })}
                />
              </div>

              <div className="col-12 mt-4">
                <h6 className="fw-bold text-navy border-bottom pb-2">Emergency Contact Information</h6>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Emergency Contact Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.emergencyName}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyName: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Relationship</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={profileForm.emergencyRelation}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyRelation: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Emergency Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.emergencyPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                />
              </div>

              <div className="col-12 mt-3">
                <label className="form-label small fw-semibold">Bio / Professional Summary</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share a short bio with your colleagues..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                />
              </div>

              <div className="col-12 mt-4 text-end">
                <button type="submit" className="btn btn-primary px-4 py-2 rounded-3 fw-semibold d-inline-flex align-items-center gap-2" disabled={loading}>
                  <Save size={18} /> {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Employment Details (Read-only for employee, managed by HR) */}
      {activeTab === 'employment' && (
        <div className="card custom-card p-4">
          <h5 className="fw-bold text-navy mb-3">Official Employment Records</h5>
          <p className="text-muted small">
            Official records are provisioned and updated exclusively by the HR Department.
          </p>

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 border">
                <span className="text-muted small d-block">Assigned Department</span>
                <span className="fw-bold text-navy fs-6">{user?.department}</span>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 border">
                <span className="text-muted small d-block">Designation</span>
                <span className="fw-bold text-navy fs-6">{user?.designation}</span>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 border">
                <span className="text-muted small d-block">Direct Reporting Manager</span>
                <span className="fw-bold text-navy fs-6">
                  {user?.manager
                    ? typeof user.manager === 'object'
                      ? `${user.manager.firstName} ${user.manager.lastName} (${user.manager.email})`
                      : user.manager
                    : 'Senior Executive (No Manager)'}
                </span>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 border">
                <span className="text-muted small d-block">Official Joining Date</span>
                <span className="fw-bold text-navy fs-6">
                  {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 border">
                <span className="text-muted small d-block">System Authorization Role</span>
                <span className="fw-bold text-navy fs-6">{user?.role}</span>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 border">
                <span className="text-muted small d-block">Account Status</span>
                <StatusBadge status={user?.status} className="mt-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="card custom-card p-4" style={{ maxWidth: '600px' }}>
          <h5 className="fw-bold text-navy mb-2">Change Account Password</h5>
          <p className="text-muted small mb-4">
            Enter your current password followed by your new password to update your authentication credentials.
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Current Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">New Password (min 6 characters)</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary px-4 py-2 rounded-3 fw-semibold" disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

