import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
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
import { attendanceAPI, reportAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#1e40af', '#f59e0b', '#06b6d4', '#10b981', '#ef4444'];

const AttendanceReportsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  // Date range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 14);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [allAttRes, summaryRes] = await Promise.all([
        attendanceAPI.getAllAttendance({
          startDate,
          endDate,
          department,
          limit: 100,
        }),
        attendanceAPI.getSummary(),
      ]);

      setRecords(allAttRes.data.records);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, department]);

  const handleExportCSV = async () => {
    try {
      const res = await reportAPI.exportAttendanceCSV({ startDate, endDate, department });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export report CSV');
    }
  };

  // Compute breakdown for Pie Chart
  const statusCounts = {
    Present: records.filter((r) => r.status === 'PRESENT').length,
    Late: records.filter((r) => r.status === 'LATE').length,
    HalfDay: records.filter((r) => r.status === 'HALF_DAY').length,
    OnLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
  };

  const pieData = [
    { name: 'Present', value: statusCounts.Present },
    { name: 'Late', value: statusCounts.Late },
    { name: 'Half Day', value: statusCounts.HalfDay },
    { name: 'On Leave', value: statusCounts.OnLeave },
  ].filter((d) => d.value > 0);

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Attendance Analytics & Reports</h3>
          <p className="text-muted small mb-0">
            Historical attendance tracking, punctuality ratios, and CSV analytics exports.
          </p>
        </div>

        <button
          className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
          onClick={handleExportCSV}
        >
          <Download size={18} /> Export Full CSV Report
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="card custom-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted small">From:</span>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted small">To:</span>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {isHR && (
            <div className="col-12 col-md-4">
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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

      {loading ? (
        <LoadingSpinner message="Generating attendance analytics..." />
      ) : (
        <>
          {/* Charts Row */}
          <div className="row g-3 g-xl-4 mb-4">
            <div className="col-12 col-lg-7">
              <div className="card custom-card p-4 h-100">
                <h6 className="fw-bold text-navy mb-3">Attendance Distribution</h6>
                {pieData.length === 0 ? (
                  <div className="text-center py-5 text-muted small">No data in selected date range.</div>
                ) : (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="card custom-card p-4 h-100">
                <h6 className="fw-bold text-navy mb-3">Metrics Snapshot</h6>
                <div className="d-flex flex-column gap-3">
                  <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">Total Records Logged</div>
                      <div className="fs-4 fw-bold text-navy">{records.length}</div>
                    </div>
                    <Users size={28} className="text-primary opacity-50" />
                  </div>

                  <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">Punctual Check-Ins</div>
                      <div className="fs-4 fw-bold text-success">{statusCounts.Present}</div>
                    </div>
                    <CheckCircle size={28} className="text-success opacity-50" />
                  </div>

                  <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">Late Arrivals</div>
                      <div className="fs-4 fw-bold text-warning">{statusCounts.Late}</div>
                    </div>
                    <Clock size={28} className="text-warning opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceReportsPage;

