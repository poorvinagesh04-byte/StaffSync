import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Shield,
  Users,
  Clock,
  CalendarCheck,
  GraduationCap,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-vh-100 bg-white d-flex flex-column">
      {/* Public Navbar */}
      <header className="navbar navbar-expand-lg border-bottom py-3 px-4 px-md-5 sticky-top bg-white bg-opacity-95">
        <div className="container-fluid px-0">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-dark text-decoration-none">
            <div className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm">
              <Shield size={22} />
            </div>
            <span>StaffSync</span>
          </Link>

          <div className="d-flex align-items-center gap-2 gap-md-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary px-4 py-2 rounded-pill fw-medium d-flex align-items-center gap-2">
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2 shadow-sm">
                Sign In <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-5 py-lg-6" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="container py-4">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6 text-center text-lg-start">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                Next-Generation Enterprise HRMS
              </span>
              <h1 className="display-4 fw-extrabold text-navy lh-tight mb-3">
                Empower Your Workforce with <span className="text-primary">StaffSync</span>
              </h1>
              <p className="lead text-muted mb-4 fs-5">
                The all-in-one modern Human Resource Management System engineered for modern teams. Streamline attendance tracking, automated leave workflows, compliance, and employee growth with multi-role security.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <Link to="/login" className="btn btn-primary btn-lg px-4 py-3 rounded-pill fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2">
                  Launch HRMS Portal <ArrowRight size={18} />
                </Link>
                <a href="#features" className="btn btn-outline-secondary btn-lg px-4 py-3 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2">
                  Explore Features
                </a>
              </div>
              <div className="mt-4 pt-2 d-flex align-items-center justify-content-center justify-content-lg-start gap-4 text-muted small">
                <span className="d-flex align-items-center gap-1">
                  <CheckCircle2 size={16} className="text-success" /> JWT Secure Auth
                </span>
                <span className="d-flex align-items-center gap-1">
                  <CheckCircle2 size={16} className="text-success" /> 3 Role Workflows
                </span>
                <span className="d-flex align-items-center gap-1">
                  <CheckCircle2 size={16} className="text-success" /> Instant Demo Access
                </span>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="position-relative">
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden p-3 p-md-4 bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-danger" style={{ width: '10px', height: '10px' }} />
                      <div className="rounded-circle bg-warning" style={{ width: '10px', height: '10px' }} />
                      <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }} />
                    </div>
                    <span className="badge bg-light text-muted border small">StaffSync Dashboard Preview</span>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border">
                        <div className="text-muted small">Present Today</div>
                        <div className="fs-3 fw-bold text-primary">94.8%</div>
                        <div className="text-success small fw-medium">▲ +2.4% vs last week</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border">
                        <div className="text-muted small">Active Employees</div>
                        <div className="fs-3 fw-bold text-navy">128</div>
                        <div className="text-muted small">Engineering, HR, Sales</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-semibold text-primary">Live Daily Check-In</div>
                      <div className="text-muted small">Server-synchronized timestamp validation</div>
                    </div>
                    <span className="badge bg-success px-3 py-2 rounded-pill">Checked In: 09:15 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-5 bg-light">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5">
            <h2 className="fw-bold text-navy mb-2">Designed for Every Tier of Your Organization</h2>
            <p className="text-muted">
              Built with role-based access control (RBAC), strict backend validation, and real-time synchronization.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="stat-icon-wrapper bg-primary bg-opacity-10 text-primary mb-3">
                  <Shield size={24} />
                </div>
                <h5 className="fw-bold mb-2">HR Administration</h5>
                <p className="text-muted small mb-0">
                  Total headcount management, employee onboarding, role provisioning, company announcements, training catalogs, and CSV report exports.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="stat-icon-wrapper bg-info bg-opacity-10 text-info mb-3">
                  <Users size={24} />
                </div>
                <h5 className="fw-bold mb-2">Manager Oversight</h5>
                <p className="text-muted small mb-0">
                  Dedicated team portals, one-click leave request approvals, attendance calendars, team performance appraisals, and skill tracking.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="stat-icon-wrapper bg-success bg-opacity-10 text-success mb-3">
                  <Clock size={24} />
                </div>
                <h5 className="fw-bold mb-2">Employee Self-Service</h5>
                <p className="text-muted small mb-0">
                  Daily Check-In & Check-Out with late detection, leave quota balances, training module progress updates, and profile personalization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Box */}
      <section className="py-5 bg-white border-top">
        <div className="container py-3">
          <div className="card border border-primary border-opacity-25 bg-primary bg-opacity-5 rounded-4 p-4">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h4 className="fw-bold text-navy mb-2">Ready to evaluate StaffSync?</h4>
                <p className="text-muted mb-lg-0">
                  Explore pre-configured demo credentials for HR, Engineering Manager, and Employees with instant 1-click login on our portal.
                </p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <Link to="/login" className="btn btn-primary px-4 py-2 rounded-pill fw-semibold">
                  Go to Login Portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 border-top text-center text-muted small bg-light">
        <div className="container">
          <p className="mb-0">&copy; {new Date().getFullYear()} StaffSync HRMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

