import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginUser, clearError } from '../store/authSlice';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    dispatch(loginUser({ email, password }));
  };

  // Demo auto-fill helper
  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('StaffSync@2025');
    setValidationErrors({});
    dispatch(loginUser({ email: demoEmail, password: 'StaffSync@2025' }));
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5 col-xl-4">
            {/* Brand Logo Header */}
            <div className="text-center mb-4">
              <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-2">
                <div className="bg-primary text-white p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center">
                  <Shield size={26} />
                </div>
                <span className="fs-3 fw-bold text-navy tracking-tight">StaffSync</span>
              </Link>
              <h5 className="fw-semibold text-muted">Sign In to Your Workspace</h5>
            </div>

            {/* Login Card */}
            <div className="card border-0 shadow-lg rounded-4 p-4 p-sm-5 bg-white">
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 rounded-3 small mb-3">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Email Field */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Corporate Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className={`form-control border-start-0 ps-0 ${
                        validationErrors.email ? 'is-invalid' : ''
                      }`}
                      placeholder="e.g. name@staffsync.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {validationErrors.email && (
                    <div className="text-danger small mt-1">{validationErrors.email}</div>
                  )}
                </div>

                {/* Password Field */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label small fw-semibold text-secondary">
                      Password
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-start-0 border-end-0 ps-0 ${
                        validationErrors.password ? 'is-invalid' : ''
                      }`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <div className="text-danger small mt-1">{validationErrors.password}</div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Account Quick Buttons */}
              <div className="mt-4 pt-3 border-top text-center">
                <span className="text-muted small fw-medium d-block mb-2">
                  One-Click Evaluation Accounts
                </span>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm py-1 rounded-2 text-start d-flex align-items-center justify-content-between"
                    onClick={() => handleDemoLogin('hr@staffsync.com')}
                    disabled={loading}
                  >
                    <span><strong>HR Administrator</strong> (Full Access)</span>
                    <span className="badge bg-primary text-white">HR</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-info btn-sm py-1 rounded-2 text-start d-flex align-items-center justify-content-between"
                    onClick={() => handleDemoLogin('manager@staffsync.com')}
                    disabled={loading}
                  >
                    <span><strong>Engineering Manager</strong> (Team Approvals)</span>
                    <span className="badge bg-info text-white">MANAGER</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-1 rounded-2 text-start d-flex align-items-center justify-content-between"
                    onClick={() => handleDemoLogin('john.doe@staffsync.com')}
                    disabled={loading}
                  >
                    <span><strong>Staff Employee</strong> (Self-Service)</span>
                    <span className="badge bg-secondary text-white">EMPLOYEE</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Back to Home Link */}
            <div className="text-center mt-3">
              <Link to="/" className="text-muted small text-decoration-none">
                &larr; Back to Public StaffSync Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

