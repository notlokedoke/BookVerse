import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    booksListed: 20,
    activeTraders: 3,
    completedTrades: 15,
    pendingRequests: 2
  });

  const [recentActivity] = useState([
    {
      id: 1,
      message: "New trade request for 'Harry Potter'",
      time: "2 hours ago",
      type: "request"
    },
    {
      id: 2,
      message: "Trade for 'The Alchemist' accepted",
      time: "5 hours ago",
      type: "success"
    },
    {
      id: 3,
      message: "New book matching your wishlist",
      time: "1 day ago",
      type: "info"
    }
  ]);

  return (
    <div className="dashboard-page">
      {/* Clean Header with Navigation */}
      <div className="dashboard-header">
        <div className="header-container">
          <Link to="/" className="logo-container">
            <div className="logo-icon">📚</div>
            <span className="logo-text">BookVerse</span>
          </Link>
          
          <nav className="header-nav">
            <Link to="/browse" className="nav-link">Browse</Link>
            <Link to="/my-books" className="nav-link">My Books</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
          </nav>
        </div>
      </div>

      {/* Main Content - Centered Layout */}
      <div className="dashboard-content">
        <div className="content-container">
          
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome back, {user?.name || 'Reader'}</h1>
            <p className="welcome-subtitle">Ready to discover your next great book?</p>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <Link to="/browse" className="action-card primary">
              <div className="action-icon">🔍</div>
              <div className="action-content">
                <h3>Browse Books</h3>
                <p>Discover books in your area</p>
              </div>
            </Link>
            
            <Link to="/my-books" className="action-card">
              <div className="action-icon">📚</div>
              <div className="action-content">
                <h3>My Books</h3>
                <p>Manage your collection</p>
              </div>
            </Link>
            
            <Link to="/trades" className="action-card">
              <div className="action-icon">🔄</div>
              <div className="action-content">
                <h3>Active Trades</h3>
                <p>{stats.activeTraders} ongoing</p>
              </div>
            </Link>
          </div>

          {/* Stats Overview - Minimal */}
          <div className="stats-section">
            <h2 className="section-title">Your BookVerse</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{stats.booksListed}</div>
                <div className="stat-label">Books Listed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.completedTrades}</div>
                <div className="stat-label">Completed Trades</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.pendingRequests}</div>
                <div className="stat-label">Pending Requests</div>
              </div>
            </div>
          </div>

          {/* Recent Activity - Simplified */}
          <div className="activity-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="activity-footer">
              <Link to="/activity" className="view-all-link">View all activity</Link>
            </div>
          </div>

          {/* Call to Action */}
          <div className="cta-section">
            <div className="cta-content">
              <h2>Ready to trade?</h2>
              <p>Find your next favorite book or share one with the community</p>
              <div className="cta-buttons">
                <Link to="/browse" className="cta-btn primary">Browse Books</Link>
                <Link to="/my-books/add" className="cta-btn secondary">List a Book</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;