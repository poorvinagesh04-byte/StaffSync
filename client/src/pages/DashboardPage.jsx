import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CalendarCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Award,
  BellRing,
  Download,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportAPI, attendanceAPI, leaveAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const COLORS = ['#1e40af', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || 'EMPLOYEE';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Digital clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, todayAttRes] = await Promise.all([
        reportAPI.getDashboardStats(),
        attendanceAPI.getToday().catch(() => ({ data: { record: null } })),
      ]);

      setStats(statsRes.data.stats);
      setTodayAttendance(todayAttRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  // Attendance Check-in handler
  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.checkIn();
      setFeedbackMessage({ type: 'success', text: res.data.message });
      await fetchDashboardData();
    } catch (err) {
      setFeedbackMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Check-in failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Attendance Check-out handler
  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.checkOut();
      setFeedbackMessage({ type: 'success', text: res.data.message });
      await fetchDashboardData();
    } catch (err) {
      setFeedbackMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Check-out failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Review Leave Request
  const handleQuickReviewLeave = async (leaveId, status) => {
    try {
      setActionLoading(true);
      await leaveAPI.reviewLeaveRequest(leaveId, {
        status,
        reviewComment: `Reviewed from Manager Quick Actions (${status})`,
      });
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review leave');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading StaffSync Dashboard..." />;
  }

  return (
    <div className="container-fluid px-0">
      {/* Top Welcome Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">
            Welcome back, {user?.firstName}!
          </h3>
          <p className="text-muted small mb-0">
            {role === 'HR' && 'Executive Human Resources Administration Dashboard'}
            {role === 'MANAGER' && `Team Operations & Approvals for ${user?.department}`}
            {role === 'EMPLOYEE' && `${user?.designation} &bull; ${user?.department}`}
          </p>
        </div>

        {/* Live Digital Clock Widget */}
        <div className="d-flex align-items-center gap-3 bg-white p-2 px-3 rounded-4 border shadow-sm">
          <div className="stat-icon-wrapper bg-primary bg-opacity-10 text-primary" style={{ width: '38px', height: '38px' }}>
            <Clock size={18} />
          </div>
          <div>
            <div className="digital-clock text-navy fs-6">{currentTime}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className={`alert alert-${feedbackMessage.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedbackMessage.text}
          <button type="button" className="btn-close" onClick={() => setFeedbackMessage(null)} />
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HR DASHBOARD VIEW                                          */}
      {/* ============================================================== */}
      {role === 'HR' && stats && (
        <>
          {/* Stat Cards Row */}
          <div className="row g-3 g-xl-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Total Headcount</span>
                  <div className="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                    <Users size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.totalEmployees}</h2>
                <div className="d-flex align-items-center gap-1 text-success small">
                  <UserCheck size={14} /> {stats.activeEmployees} Active Employees
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Present Today</span>
                  <div className="stat-icon-wrapper bg-success bg-opacity-10 text-success">
                    <Clock size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.presentToday}</h2>
                <div className="text-muted small">
                  {stats.lateToday > 0 && <span className="text-warning me-2">{stats.lateToday} Late</span>}
                  <span>Checked in</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Employees on Leave</span>
                  <div className="stat-icon-wrapper bg-info bg-opacity-10 text-info">
                    <CalendarCheck size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.onLeaveToday}</h2>
                <div className="text-muted small">Approved leaves today</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Pending Requests</span>
                  <div className="stat-icon-wrapper bg-warning bg-opacity-10 text-warning">
                    <AlertCircle size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.pendingLeaves}</h2>
                <Link to="/leaves" className="text-primary text-decoration-none small fw-medium d-flex align-items-center gap-1">
                  Review queue <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-3 g-xl-4 mb-4">
            {/* Weekly Attendance Trend */}
            <div className="col-12 col-lg-8">
              <div className="card custom-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-navy mb-0">Weekly Attendance Trends</h6>
                  <span className="badge bg-light text-muted border small">Past 7 Days</span>
                </div>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="present" fill="#1e40af" name="Present" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="onLeave" fill="#0ea5e9" name="On Leave" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="col-12 col-lg-4">
              <div className="card custom-card p-4 h-100">
                <h6 className="fw-bold text-navy mb-3">Department Headcount</h6>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.departmentStats || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {(stats.departmentStats || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-center text-muted small">
                  Total Active Departments: {stats.departmentStats?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Audit Activities */}
          <div className="card custom-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-navy mb-0">Recent Organization Activities & Logs</h6>
              <Link to="/employees" className="small text-primary text-decoration-none fw-medium">
                View Directory &rarr;
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Performed By</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentActivities || []).map((log) => (
                    <tr key={log._id}>
                      <td>
                        <span className="badge bg-light text-navy border small">
                          {log.action}
                        </span>
                      </td>
                      <td>
                        {log.performedBy ? (
                          <span className="fw-medium">
                            {log.performedBy.firstName} {log.performedBy.lastName} ({log.performedBy.role})
                          </span>
                        ) : (
                          <span className="text-muted">System</span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </td>
                      <td className="text-muted small">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. MANAGER DASHBOARD VIEW                                      */}
      {/* ============================================================== */}
      {role === 'MANAGER' && stats && (
        <>
          <div className="row g-3 g-xl-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Direct Team Size</span>
                  <div className="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                    <Users size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.teamSize}</h2>
                <span className="text-muted small">Active direct reports</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Team Present Today</span>
                  <div className="stat-icon-wrapper bg-success bg-opacity-10 text-success">
                    <Clock size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.teamPresentToday}</h2>
                <span className="text-success small fw-medium">
                  {stats.teamSize > 0 ? `${Math.round((stats.teamPresentToday / stats.teamSize) * 100)}% attendance` : '0%'}
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Team on Leave</span>
                  <div className="stat-icon-wrapper bg-info bg-opacity-10 text-info">
                    <CalendarCheck size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.teamOnLeaveToday}</h2>
                <span className="text-muted small">Out of office today</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card custom-card h-100 stat-widget">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-medium">Pending Approvals</span>
                  <div className="stat-icon-wrapper bg-warning bg-opacity-10 text-warning">
                    <AlertCircle size={22} />
                  </div>
                </div>
                <h2 className="fw-bold text-navy mb-1">{stats.pendingLeavesCount}</h2>
                <span className="text-muted small">Requires your review</span>
              </div>
            </div>
          </div>

          {/* Pending Leave Requests Queue for Manager */}
          <div className="card custom-card p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold text-navy mb-1">Direct Reports Leave Approval Queue</h6>
                <p className="text-muted small mb-0">Authorize or reject team leave applications</p>
              </div>
              <Link to="/leaves" className="small text-primary text-decoration-none fw-medium">
                View All Leaves &rarr;
              </Link>
            </div>

            {stats.pendingLeavesList?.length === 0 ? (
              <div className="p-4 text-center text-muted bg-light rounded-3 small">
                No pending leave requests awaiting approval.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pendingLeavesList.map((req) => (
                      <tr key={req._id}>
                        <td>
                          <div className="fw-semibold">
                            {req.user?.firstName} {req.user?.lastName}
                          </div>
                          <span className="text-muted small">{req.user?.employeeId}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-navy border small">
                            {req.leaveType}
                          </span>
                        </td>
                        <td>{req.durationDays} day(s)</td>
                        <td className="small text-muted">
                          {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="small text-muted" style={{ maxWidth: '200px' }}>
                          {req.reason}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-success px-3 rounded-pill"
                              disabled={actionLoading}
                              onClick={() => handleQuickReviewLeave(req._id, 'APPROVED')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger px-3 rounded-pill"
                              disabled={actionLoading}
                              onClick={() => handleQuickReviewLeave(req._id, 'REJECTED')}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Team Members Roster */}
          <div className="card custom-card p-4">
            <h6 className="fw-bold text-navy mb-3">Team Members Roster</h6>
            <div className="row g-3">
              {(stats.teamMembers || []).map((member) => (
                <div key={member._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt="Member"
                        className="rounded-circle"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                        {member.fullName?.[0]}
                      </div>
                    )}
                    <div className="lh-sm text-truncate">
                      <div className="fw-semibold text-truncate small">{member.fullName}</div>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>{member.designation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 3. EMPLOYEE DASHBOARD VIEW                                     */}
      {/* ============================================================== */}
      {role === 'EMPLOYEE' && stats && (
        <>
          {/* Daily Check-In / Check-Out Widget & Leave Balances */}
          <div className="row g-3 g-xl-4 mb-4">
            {/* Attendance Action Card */}
            <div className="col-12 col-lg-5">
              <div className="card custom-card p-4 h-100 border-primary border-opacity-25 bg-primary bg-opacity-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-navy mb-0">Daily Attendance Action</h6>
                  <StatusBadge status={todayAttendance?.record?.status || 'ABSENT'} />
                </div>

                <div className="my-3 text-center">
                  <div className="digital-clock fs-2 text-primary fw-bold mb-1">
                    {currentTime}
                  </div>
                  <div className="text-muted small">
                    {todayAttendance?.hasCheckedIn
                      ? `Checked in at: ${new Date(todayAttendance.record.checkIn).toLocaleTimeString()}`
                      : 'You have not checked in for today yet.'}
                  </div>
                  {todayAttendance?.hasCheckedOut && (
                    <div className="text-muted small mt-1">
                      Checked out at: {new Date(todayAttendance.record.checkOut).toLocaleTimeString()} ({todayAttendance.record.totalHours} hrs)
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button
                    className="btn btn-primary px-4 py-2 rounded-pill fw-semibold shadow-sm"
                    disabled={todayAttendance?.hasCheckedIn || actionLoading}
                    onClick={handleCheckIn}
                  >
                    {todayAttendance?.hasCheckedIn ? 'Checked In' : 'Check In Now'}
                  </button>
                  <button
                    className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold"
                    disabled={!todayAttendance?.hasCheckedIn || todayAttendance?.hasCheckedOut || actionLoading}
                    onClick={handleCheckOut}
                  >
                    {todayAttendance?.hasCheckedOut ? 'Checked Out' : 'Check Out'}
                  </button>
                </div>
              </div>
            </div>

            {/* Leave Balance Quotas */}
            <div className="col-12 col-lg-7">
              <div className="card custom-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-navy mb-0">Your Leave Balances ({new Date().getFullYear()})</h6>
                  <Link to="/leaves" className="small text-primary text-decoration-none fw-medium">
                    Apply Leave &rarr;
                  </Link>
                </div>

                <div className="row g-3">
                  <div className="col-sm-4">
                    <div className="p-3 rounded-3 bg-light border text-center">
                      <span className="text-muted small fw-medium">Casual Leave</span>
                      <h3 className="fw-bold text-primary my-1">
                        {stats.leaveBalance.casualLeave.total - stats.leaveBalance.casualLeave.used}
                      </h3>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Used: {stats.leaveBalance.casualLeave.used} of {stats.leaveBalance.casualLeave.total}
                      </span>
                    </div>
                  </div>

                  <div className="col-sm-4">
                    <div className="p-3 rounded-3 bg-light border text-center">
                      <span className="text-muted small fw-medium">Sick Leave</span>
                      <h3 className="fw-bold text-info my-1">
                        {stats.leaveBalance.sickLeave.total - stats.leaveBalance.sickLeave.used}
                      </h3>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Used: {stats.leaveBalance.sickLeave.used} of {stats.leaveBalance.sickLeave.total}
                      </span>
                    </div>
                  </div>

                  <div className="col-sm-4">
                    <div className="p-3 rounded-3 bg-light border text-center">
                      <span className="text-muted small fw-medium">Earned Leave</span>
                      <h3 className="fw-bold text-success my-1">
                        {stats.leaveBalance.earnedLeave.total - stats.leaveBalance.earnedLeave.used}
                      </h3>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Used: {stats.leaveBalance.earnedLeave.used} of {stats.leaveBalance.earnedLeave.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Announcements & Recent Leaves */}
          <div className="row g-3 g-xl-4">
            <div className="col-12 col-lg-6">
              <div className="card custom-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-navy mb-0">Company Announcements</h6>
                  <Link to="/announcements" className="small text-primary text-decoration-none fw-medium">
                    View All &rarr;
                  </Link>
                </div>

                <div className="d-flex flex-column gap-3">
                  {stats.recentAnnouncements?.length === 0 ? (
                    <p className="text-muted small">No announcements at this time.</p>
                  ) : (
                    stats.recentAnnouncements.map((item) => (
                      <div key={item._id} className="p-3 rounded-3 bg-light border">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-semibold small text-navy">{item.title}</span>
                          <StatusBadge status={item.priority} />
                        </div>
                        <p className="text-muted small mb-0">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card custom-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-navy mb-0">My Recent Leave Requests</h6>
                  <Link to="/leaves" className="small text-primary text-decoration-none fw-medium">
                    Leave History &rarr;
                  </Link>
                </div>

                {stats.recentLeaves?.length === 0 ? (
                  <p className="text-muted small">You haven't requested any leaves yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Dates</th>
                          <th>Days</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentLeaves.map((l) => (
                          <tr key={l._id}>
                            <td><span className="fw-semibold small">{l.leaveType}</span></td>
                            <td className="small text-muted">
                              {new Date(l.startDate).toLocaleDateString()}
                            </td>
                            <td>{l.durationDays}</td>
                            <td><StatusBadge status={l.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;

