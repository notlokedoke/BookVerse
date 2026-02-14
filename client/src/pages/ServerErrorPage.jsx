import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import './ServerErrorPage.css';

const ServerErrorPage = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="server-error-page">
      <div className="server-error-container">
        <div className="error-icon">
          <AlertTriangle size={80} strokeWidth={1.5} />
        </div>
        
        <h1 className="error-code">500</h1>
        <h2 className="error-title">Server Error</h2>
        
        <p className="error-message">
          Something went wrong on our end. Our team has been notified and 
          we're working to fix the issue. Please try again in a few moments.
        </p>

        <div className="error-actions">
          <button onClick={handleRefresh} className="error-button primary">
            <RefreshCw size={20} />
            Refresh Page
          </button>
          <Link to="/" className="error-button secondary">
            <Home size={20} />
            Go Home
          </Link>
        </div>

        <div className="error-details">
          <p className="details-title">What you can do:</p>
          <ul>
            <li>Wait a few minutes and try again</li>
            <li>Check your internet connection</li>
            <li>Clear your browser cache and cookies</li>
            <li>If the problem persists, contact our support team</li>
          </ul>
        </div>

        <div className="error-support">
          <p>Need help? <a href="mailto:support@bookverse.com">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
