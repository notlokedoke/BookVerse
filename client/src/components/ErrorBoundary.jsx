import React from 'react';
import ServerErrorPage from '../pages/ServerErrorPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, timestamp: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const timestamp = new Date().toISOString();
    
    // Log error details with timestamp for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', {
        timestamp,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href
      });
    }
    
    // In production, log to error reporting service (e.g., Sentry, LogRocket)
    // Example: logErrorToService({ error, errorInfo, timestamp });
    
    // Store error in state but never expose to user
    this.setState({
      error: error,
      errorInfo: errorInfo,
      timestamp: timestamp
    });
  }

  render() {
    if (this.state.hasError) {
      // Render custom error page
      return <ServerErrorPage />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
