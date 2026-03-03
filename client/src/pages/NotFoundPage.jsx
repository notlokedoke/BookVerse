import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, Search } from 'lucide-react';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="error-icon">
          <BookOpen size={80} strokeWidth={1.5} />
        </div>
        
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        
        <p className="error-message">
          Oops! The page you're looking for seems to have wandered off. 
          It might have been traded away or never existed in our library.
        </p>

        <div className="error-actions">
          <Link to="/" className="error-button primary">
            <Home size={20} />
            Go Home
          </Link>
          <Link to="/browse" className="error-button secondary">
            <Search size={20} />
            Browse Books
          </Link>
        </div>

        <div className="error-suggestions">
          <p className="suggestions-title">You might want to:</p>
          <ul>
            <li>Check the URL for typos</li>
            <li>Return to the previous page</li>
            <li>Visit our <Link to="/browse">browse page</Link> to discover books</li>
            <li>Go to your <Link to="/dashboard">dashboard</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
