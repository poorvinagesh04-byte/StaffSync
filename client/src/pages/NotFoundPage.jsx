import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center p-4">
      <div className="stat-icon-wrapper bg-warning bg-opacity-10 text-warning mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
        <AlertTriangle size={36} />
      </div>
      <h1 className="display-4 fw-extrabold text-navy">404</h1>
      <h4 className="fw-bold mb-2">Page Not Found</h4>
      <p className="text-muted small mb-4" style={{ maxWidth: '420px' }}>
        The page you are looking for does not exist or has been moved to another location.
      </p>
      <Link to="/dashboard" className="btn btn-primary px-4 py-2 rounded-pill d-flex align-items-center gap-2">
        <ArrowLeft size={16} /> Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;

