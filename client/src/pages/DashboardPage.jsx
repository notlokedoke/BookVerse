import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Mock Data for Dashboard
  const [stats] = useState({
    booksListed: 20,
    activeTrades: 3,
    completedTrades: 15,
    pendingRequests: 2
  });

  const [activeTrades] = useState([
    {
      id: 1,
      bookTitle: "The Great Gatsby",
      partnerName: "Jane Doe",
      status: "In Progress"
    },
    {
      id: 2,
      bookTitle: "1984",
      partnerName: "Mark Smith",
      status: "Accepted"
    },
    {
      id: 3,
      bookTitle: "To Kill a Mockingbird",
      partnerName: "Emily Clark",
      status: "Pending"
    }
  ]);

  const [tradeRequests] = useState([
    {
      id: 1,
      user: { name: "Alice Johnson" },
      book: "Moby Dick"
    },
    {
      id: 2,
      user: { name: "Kevin Brown" },
      book: "Brave New World"
    }
  ]);

  const [recommendedBooks] = useState([
    { id: 1, title: "The Catcher in the Rye", author: "J.D. Salinger" },
    { id: 2, title: "Pride and Prejudice", author: "Jane Austen" },
    { id: 3, title: "Wuthering Heights", author: "Emily Brontë" },
    { id: 4, title: "The Hobbit", author: "J.R.R. Tolkien" },
    { id: 5, title: "War and Peace", author: "Leo Tolstoy" }
  ]);

  const [activities] = useState([
    {
      id: 1,
      title: "New Trade Request Received",
      text: "Received a new trade request for 'Harry Potter'.",
      user: { name: "Tommy Lee" }
    },
    {
      id: 2,
      title: "Trade Status Updated/Image",
      text: "Your trade for 'The Alchemist' has been accepted!",
      user: { name: "Sam Rivera" }
    },
    {
      id: 3,
      title: "New Wishlist Match/Image",
      text: "New book added matching your wishlist: 'Great Expectations'.",
      user: { name: "Emma White" }
    }
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('dashboard-search');
    if (query && query.trim()) {
      navigate(`/browse?title=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Main Content */}
      <main className="dashboard-main-full">
        {/* Top Bar with Search */}
        <div className="dashboard-topbar">
          <form onSubmit={handleSearch} className="topbar-search">
            <input
              type="text"
              name="dashboard-search"
              placeholder="Search books..."
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Welcome Section */}
        <section className="welcome-section">
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'Username'}!</h1>
          <p className="current-date">{currentDate}</p>
        </section>

        {/* Quick Stats */}
        <section className="quick-stats-section">
          <h2 className="section-title">Quick Stats</h2>
          <div className="quick-stats-grid">
            <div className="quick-stat-card">
              <span className="quick-stat-label">Books Listed</span>
              <span className="quick-stat-value">{stats.booksListed}</span>
            </div>
            <div className="quick-stat-card">
              <span className="quick-stat-label">Active Trades</span>
              <span className="quick-stat-value">{stats.activeTrades}</span>
            </div>
            <div className="quick-stat-card">
              <span className="quick-stat-label">Completed Trades</span>
              <span className="quick-stat-value">{stats.completedTrades}</span>
            </div>
            <div className="quick-stat-card">
              <span className="quick-stat-label">Pending Requests</span>
              <span className="quick-stat-value">{stats.pendingRequests}</span>
            </div>
          </div>
        </section>

        {/* Active Trades */}
        <section className="active-trades-section">
          <h2 className="section-title">Active Trades</h2>
          <div className="active-trades-grid">
            {activeTrades.map(trade => (
              <div key={trade.id} className="active-trade-card">
                <div className="trade-book-circle"></div>
                <h3 className="trade-book-title">{trade.bookTitle}</h3>
                <p className="trade-partner">Trading with {trade.partnerName}</p>
                <p className="trade-status">Status: {trade.status}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trade Requests */}
        <section className="trade-requests-section">
          <h2 className="section-title">Trade Requests</h2>
          <div className="trade-requests-list">
            {tradeRequests.map(req => (
              <div key={req.id} className="trade-request-item">
                <div className="request-user">
                  <div className="user-avatar-circle"></div>
                  <div className="user-details">
                    <span className="user-name">{req.user.name}</span>
                    <span className="wants-book">Wants: {req.book}</span>
                  </div>
                </div>
                <div className="request-actions">
                  <button className="action-link accept">Accept</button>
                  <span className="action-separator">/</span>
                  <button className="action-link decline">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Books */}
        <section className="recommended-section">
          <h2 className="section-title">Recommended Books</h2>
          <div className="recommended-books-grid">
            {recommendedBooks.map(book => (
              <div key={book.id} className="recommended-book-card">
                <button className="request-trade-btn">Request Trade</button>
                <div className="book-cover-placeholder">
                  <span>Book Cover {book.id}</span>
                </div>
                <h4 className="book-title">{book.title}</h4>
                <p className="book-author">Author: {book.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section className="activity-section">
          <h2 className="section-title">Recent Activity Feed</h2>
          <div className="activity-feed-grid">
            {activities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-image-placeholder">
                  <span className="activity-label">{activity.title}</span>
                  <div className="placeholder-dots">...</div>
                </div>
                <div className="activity-content">
                  <p className="activity-text">{activity.text}</p>
                  <div className="activity-user">
                    <div className="user-avatar-small"></div>
                    <span className="user-name">{activity.user.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;