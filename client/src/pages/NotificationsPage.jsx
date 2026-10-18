import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  CalendarCheck,
  Clock,
  BellRing,
  GraduationCap,
  Info,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../store/notificationSlice';
import { notificationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const getNotifIcon = (type) => {
  switch (type) {
    case 'LEAVE':
      return <CalendarCheck size={18} className="text-primary" />;
    case 'ATTENDANCE':
      return <Clock size={18} className="text-warning" />;
    case 'ANNOUNCEMENT':
      return <BellRing size={18} className="text-info" />;
    case 'TRAINING':
      return <GraduationCap size={18} className="text-success" />;
    default:
      return <Info size={18} className="text-secondary" />;
  }
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationAPI.deleteNotification(id);
      dispatch(fetchNotifications());
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Notifications Center</h3>
          <p className="text-muted small mb-0">
            Real-time notifications for approvals, corporate announcements, and training enrollments.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            disabled={unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-3 d-flex gap-2">
        <button
          className={`btn btn-sm ${!unreadOnly ? 'btn-primary' : 'btn-light border'} rounded-pill px-3`}
          onClick={() => setUnreadOnly(false)}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-light border'} rounded-pill px-3`}
          onClick={() => setUnreadOnly(true)}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : filtered.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <Bell size={48} className="mx-auto mb-3 text-secondary opacity-50" />
          <h5>No notifications to display</h5>
          <p className="small mb-0">You are all caught up!</p>
        </div>
      ) : (
        <div className="card custom-card overflow-hidden">
          <div className="list-group list-group-flush">
            {filtered.map((item) => (
              <div
                key={item._id}
                className={`list-group-item list-group-item-action p-3 d-flex align-items-start justify-content-between gap-3 cursor-pointer ${
                  !item.isRead ? 'bg-primary bg-opacity-5' : ''
                }`}
                onClick={() => {
                  if (!item.isRead) handleMarkRead(item._id);
                  if (item.link) navigate(item.link);
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className="stat-icon-wrapper bg-light rounded-circle p-2 mt-1">
                    {getNotifIcon(item.type)}
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="fw-bold text-navy mb-0 small">{item.title}</h6>
                      {!item.isRead && (
                        <span className="badge bg-primary text-white rounded-pill px-2" style={{ fontSize: '0.65rem' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-muted small mb-1">{item.message}</p>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-link text-danger p-1"
                    title="Delete Notification"
                    onClick={(e) => handleDelete(e, item._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

