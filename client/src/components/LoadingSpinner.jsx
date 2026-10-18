import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '60vh' }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: '3rem', height: '3rem' }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center p-4">
      <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
      <span className="text-muted small">{message}</span>
    </div>
  );
};

export default LoadingSpinner;

