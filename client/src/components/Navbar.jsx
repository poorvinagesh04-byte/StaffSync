import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';
import { fetchNotifications, markNotificationRead } from '../store/notificationSlice';

const Navbar = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const { items: notifications, unreadCount } = useSelector(
    (state) => state.notifications
  );

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      dispatch(markNotificationRead(notif._id));
    }
    setShowNotifDropdown(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="app-topbar d-flex align-items-center justify-content-between px-3 px-lg-4">
      {/* Left: Sidebar toggle & Global Search */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light border-0 d-flex align-items-center justify-content-center p-2 rounded-3 text-secondary"
          onClick={onToggleSidebar}
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-1 border" style={{ width: '280px' }}>
          <Search size={16} className="text-muted me-2" />
          <input
            type="text"
            className="form-control form-control-sm border-0 bg-transparent p-1 shadow-none"
            placeholder="Search StaffSync..."
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Dark/Light mode toggle */}
        <button
          className="btn btn-light border-0 rounded-circle p-2 text-secondary"
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {mode === 'light' ? <Moon size={19} /> : <Sun size={19} className="text-warning" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-light border-0 rounded-circle p-2 text-secondary position-relative"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div
              className="position-absolute end-0 mt-2 card shadow-lg border-0 rounded-4 p-0"
              style={{ width: '320px', zIndex: 1050 }}
            >
              <div className="card-header bg-transparent d-flex align-items-center justify-content-between py-2 px-3 border-bottom">
                <span className="fw-semibold small">Notifications</span>
                <span className="badge bg-primary-subtle text-primary rounded-pill small">
                  {unreadCount} new
                </span>
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="p-3 text-center text-muted small">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <button
                      key={n._id}
                      className={`list-group-item list-group-item-action p-2 px-3 border-0 text-start ${
                        !n.isRead ? 'bg-light' : ''
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-semibold small text-truncate">{n.title}</span>
                        {!n.isRead && (
                          <span className="p-1 bg-primary rounded-circle ms-2" />
                        )}
                      </div>
                      <p className="text-muted small mb-0 text-truncate">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="card-footer bg-transparent text-center py-2 border-top">
                <Link
                  to="/notifications"
                  className="small text-primary text-decoration-none fw-medium"
                  onClick={() => setShowNotifDropdown(false)}
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-light border-0 d-flex align-items-center gap-2 p-1 px-2 rounded-pill"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="rounded-circle"
                style={{ width: '34px', height: '34px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}
              >
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <div className="d-none d-lg-block text-start lh-1 me-1">
              <div className="fw-semibold text-truncate small" style={{ maxWidth: '120px' }}>
                {user?.fullName || `${user?.firstName} ${user?.lastName}`}
              </div>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                {user?.role}
              </span>
            </div>
          </button>

          {showProfileDropdown && (
            <div
              className="position-absolute end-0 mt-2 card shadow-lg border-0 rounded-4 p-2"
              style={{ width: '220px', zIndex: 1050 }}
            >
              <div className="px-3 py-2 border-bottom mb-1">
                <div className="fw-bold small">{user?.fullName}</div>
                <div className="text-muted small text-truncate">{user?.email}</div>
                <span className="badge bg-primary-subtle text-primary mt-1" style={{ fontSize: '0.7rem' }}>
                  {user?.role} - {user?.department}
                </span>
              </div>
              <Link
                to="/profile"
                className="dropdown-item d-flex align-items-center gap-2 rounded-3 py-2 px-3 small"
                onClick={() => setShowProfileDropdown(false)}
              >
                <UserIcon size={16} /> My Profile & Settings
              </Link>
              <hr className="my-1 text-muted opacity-25" />
              <button
                className="dropdown-item d-flex align-items-center gap-2 rounded-3 py-2 px-3 small text-danger"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

