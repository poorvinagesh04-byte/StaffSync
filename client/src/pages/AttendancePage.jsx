import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { attendanceAPI, reportAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const AttendancePage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const isPrivileged = isHR || isManager;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters for HR/Manager
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayRes = await attendanceAPI.getToday();
      setTodayRecord(todayRes.data);

      if (isPrivileged) {
        const [allAttRes, sumRes] = await Promise.all([
          attendanceAPI.getAllAttendance({
            date: selectedDate,
            status: statusFilter,
            department: departmentFilter,
            limit: 50,
          }),
          attendanceAPI.getSummary(selectedDate),
        ]);
        setAttendanceRecords(allAttRes.data.records);
        setSummary(sumRes.data);
      } else {
        const myHistRes = await attendanceAPI.getMyHistory({ limit: 31 });
        setAttendanceRecords(myHistRes.data.records);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, statusFilter, departmentFilter]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.checkIn();
      setFeedback({ type: 'success', text: res.data.message });
      fetchData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Check-in failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.checkOut();
      setFeedback({ type: 'success', text: res.data.message });
      fetchData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Check-out failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await reportAPI.exportAttendanceCSV({
        startDate: selectedDate,
        endDate: selectedDate,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `staffsync_attendance_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Attendance Management</h3>
          <p className="text-muted small mb-0">
            Real-time biometric & server-side check-in, work hours logging, and daily summaries.
          </p>
        </div>

        {isPrivileged && (
          <button
            className="btn btn-outline-secondary px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            onClick={handleExportCSV}
          >
            <Download size={18} /> Export Daily CSV
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 py-2 small`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Daily Action Banner for current user */}
      <div className="card custom-card p-4 mb-4 border-primary border-opacity-25 bg-primary bg-opacity-5">
        <div className="row align-items-center gy-3">
          <div className="col-lg-4 text-center text-lg-start border-end-lg">
            <span className="text-muted small fw-medium">Live Clock</span>
            <div className="digital-clock fs-2 text-primary fw-bold my-1">
              {currentTime}
            </div>
            <div className="text-muted small">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="col-lg-4 text-center">
            <span className="text-muted small fw-medium d-block mb-1">Your Attendance Today</span>
            <StatusBadge status={todayRecord?.record?.status || 'NOT CHECKED IN'} className="fs-6 px-3 py-1" />
            <div className="text-muted small mt-2">
              {todayRecord?.hasCheckedIn
                ? `Checked in: ${new Date(todayRecord.record.checkIn).toLocaleTimeString()}`
                : 'Not checked in yet'}
              {todayRecord?.hasCheckedOut && (
                <span> &bull; Checked out: {new Date(todayRecord.record.checkOut).toLocaleTimeString()} ({todayRecord.record.totalHours} hrs)</span>
              )}
            </div>
          </div>

          <div className="col-lg-4 text-center text-lg-end">
            <div className="d-inline-flex gap-2">
              <button
                className="btn btn-primary px-4 py-2 rounded-pill fw-semibold shadow-sm"
                disabled={todayRecord?.hasCheckedIn || actionLoading}
                onClick={handleCheckIn}
              >
                {todayRecord?.hasCheckedIn ? 'Checked In' : 'Check In Now'}
              </button>
              <button
                className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold"
                disabled={!todayRecord?.hasCheckedIn || todayRecord?.hasCheckedOut || actionLoading}
                onClick={handleCheckOut}
              >
                {todayRecord?.hasCheckedOut ? 'Checked Out' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privileged Summary Stats */}
      {isPrivileged && summary && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-white border rounded-3 text-center custom-card">
              <span className="text-muted small">Checked In</span>
              <h4 className="fw-bold text-navy my-1">{summary.totalCheckedIn} / {summary.totalEmployees}</h4>
              <span className="text-success small fw-medium">{summary.attendanceRate}% Rate</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-white border rounded-3 text-center custom-card">
              <span className="text-muted small">On-Time</span>
              <h4 className="fw-bold text-success my-1">{summary.presentCount}</h4>
              <span className="text-muted small">Before 09:30 AM</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-white border rounded-3 text-center custom-card">
              <span className="text-muted small">Late Check-Ins</span>
              <h4 className="fw-bold text-warning my-1">{summary.lateCount}</h4>
              <span className="text-muted small">After 09:30 AM</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-white border rounded-3 text-center custom-card">
              <span className="text-muted small">On Approved Leave</span>
              <h4 className="fw-bold text-info my-1">{summary.onLeaveCount}</h4>
              <span className="text-muted small">{summary.absentCount} Absent</span>
            </div>
          </div>
        </div>
      )}

      {/* Privileged Filters Bar */}
      {isPrivileged && (
        <div className="card custom-card p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light text-muted small">Date:</span>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            {isHR && (
              <div className="col-6 col-md-4">
                <select
                  className="form-select"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table: Daily Log (HR/Manager) or Personal History (Employee) */}
      <div className="card custom-card overflow-hidden">
        <div className="card-header bg-transparent py-3 px-4 border-bottom">
          <h6 className="fw-bold text-navy mb-0">
            {isPrivileged
              ? `Daily Attendance Roster (${new Date(selectedDate).toLocaleDateString()})`
              : 'Your Monthly Attendance History'}
          </h6>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading attendance records..." />
        ) : attendanceRecords.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <Clock size={44} className="mx-auto mb-2 text-secondary opacity-50" />
            <p className="mb-0">No attendance records found for this selection.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  {isPrivileged && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((item) => (
                  <tr key={item._id}>
                    {isPrivileged && (
                      <td>
                        <div className="fw-semibold text-navy">
                          {item.user?.firstName} {item.user?.lastName}
                        </div>
                        <span className="text-muted small">
                          {item.user?.employeeId} &bull; {item.user?.department}
                        </span>
                      </td>
                    )}
                    <td className="small text-muted">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="small">
                      {item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : '--:--'}
                    </td>
                    <td className="small">
                      {item.checkOut ? new Date(item.checkOut).toLocaleTimeString() : '--:--'}
                    </td>
                    <td>
                      <span className="fw-bold">{item.totalHours ? `${item.totalHours} hrs` : '--'}</span>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="small text-muted">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

