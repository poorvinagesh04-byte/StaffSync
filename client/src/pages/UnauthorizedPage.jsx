import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center p-4">
      <div className="stat-icon-wrapper bg-danger bg-opacity-10 text-danger mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
        <ShieldAlert size={36} />
      </div>
      <h1 className="display-4 fw-extrabold text-navy">403</h1>
      <h4 className="fw-bold mb-2">Access Forbidden</h4>
      <p className="text-muted small mb-4" style={{ maxWidth: '420px' }}>
        Your role does not have authorization permissions to access this administrative module or resource.
      </p>
      <Link to="/dashboard" className="btn btn-primary px-4 py-2 rounded-pill d-flex align-items-center gap-2">
        <ArrowLeft size={16} /> Return to Permitted Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;

