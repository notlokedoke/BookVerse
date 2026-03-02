import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import {
  BookOpen,
  RefreshCw,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Library,
  TrendingUp,
  ArrowRight,
  Calendar,
  User,
  Bell,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Heart,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import FloatingActionButton from '../components/FloatingActionButton';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    booksListed: 0,
    activeTrades: 0,
    completedTrades: 0,
    pendingRequests: 0
  });
  const [pendingTrades, setPendingTrades] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [userBooks, setUserBooks] = useState([]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get today's date formatted
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 5;

    if (user?.name) completed++;
    if (user?.email) completed++;
    if (user?.city) completed++;
    if (userBooks.length > 0) completed++;
    if (allTrades.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  // Get profile completion items
  const getProfileItems = () => {
    return [
      { label: 'Add your name', completed: !!user?.name },
      { label: 'Verify email', completed: !!user?.email },
      { label: 'Set your location', completed: !!user?.city },
      { label: 'List your first book', completed: userBooks.length > 0 },
      { label: 'Complete a trade', completed: allTrades.some(t => t.status === 'completed') }
    ];
  };

  // Calculate trade success rate
  const getTradeSuccessRate = () => {
    const completed = allTrades.filter(t => t.status === 'completed').length;
    const declined = allTrades.filter(t => t.status === 'declined').length;
    const total = completed + declined;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Get recent activity items
  const getRecentActivity = () => {
    const activities = [];

    // Add recent trades as activities
    allTrades.slice(0, 5).forEach(trade => {
      const isProposer = trade.proposer._id === user?.userId;
      activities.push({
        id: trade._id,
        type: 'trade',
        status: trade.status,
        title: isProposer
          ? `Trade proposed to ${trade.receiver?.name}`
          : `Trade received from ${trade.proposer?.name}`,
        book: trade.requestedBook?.title,
        time: new Date(trade.createdAt || Date.now()),
        icon: trade.status === 'completed' ? 'completed' : trade.status === 'accepted' ? 'active' : 'pending'
      });
    });

    // Sort by time
    return activities.sort((a, b) => b.time - a.time).slice(0, 5);
  };

  // Format relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all trades
      const tradesRes = await axios.get('/api/trades', config);
      const trades = tradesRes.data.data || [];
      setAllTrades(trades);

      // Separate pending requests (where current user is receiver)
      const pending = trades.filter(
        trade => trade.status === 'proposed' && trade.receiver._id === user._id
      );

      // Active trades (accepted trades)
      const active = trades.filter(
        trade => trade.status === 'accepted'
      );

      // Completed trades
      const completed = trades.filter(
        trade => trade.status === 'completed'
      );

      // Fetch user's books
      const booksRes = await axios.get(`/api/books/user/${user._id}`);
      const books = booksRes.data.data?.books || [];
      setUserBooks(books);

      // Fetch recent books from all users (for recommendations)
      const allBooksRes = await axios.get('/api/books?limit=8');
      const allBooks = allBooksRes.data.data?.books || [];

      // Update stats
      setStats({
        booksListed: books.length,
        activeTrades: active.length,
        completedTrades: completed.length,
        pendingRequests: pending.length
      });

      setPendingTrades(pending);
      setActiveTrades(active);
      setRecentBooks(allBooks);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/trades/${tradeId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Trade accepted!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to accept trade');
    }
  };

  const handleDeclineTrade = async (tradeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/trades/${tradeId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Trade declined');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to decline trade');
    }
  };

  const profileCompletion = calculateProfileCompletion();
  const successRate = getTradeSuccessRate();
  const recentActivity = getRecentActivity();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-stats">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
          <div className="skeleton-section"></div>
          <div className="skeleton-section"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="welcome-text">
            <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!</h1>
            <p className="welcome-date">
              <Calendar size={14} />
              {getFormattedDate()}
            </p>
          </div>
        </div>
        <div className="welcome-actions">
          <Link to="/browse" className="action-btn-secondary">
            <Search size={18} />
            Browse Books
          </Link>
        </div>
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column - Profile & Analytics */}
        <div className="dashboard-sidebar">
          {/* Profile Completion Card */}
          {profileCompletion < 100 && (
            <div className="profile-card glass-card">
              <div className="profile-header">
                <h3>Complete Your Profile</h3>
                <span className="profile-badge">{profileCompletion}%</span>
              </div>
              <div className="progress-ring-container">
                <svg className="progress-ring" viewBox="0 0 100 100">
                  <circle className="progress-ring-bg" cx="50" cy="50" r="40" />
                  <circle
                    className="progress-ring-fill"
                    cx="50" cy="50" r="40"
                    style={{ strokeDashoffset: 251.2 - (251.2 * profileCompletion / 100) }}
                  />
                </svg>
                <div className="progress-ring-text">
                  <Sparkles size={20} />
                </div>
              </div>
              <ul className="profile-checklist">
                {getProfileItems().map((item, idx) => (
                  <li key={idx} className={item.completed ? 'completed' : ''}>
                    <CheckCircle size={14} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trading Analytics Card */}
          <div className="analytics-card glass-card">
            <div className="analytics-header">
              <h3><Activity size={18} /> Trading Analytics</h3>
            </div>
            <div className="analytics-stats">
              <div className="analytics-stat">
                <span className="analytics-label">Success Rate</span>
                <div className="analytics-value">
                  <span className="big-number">{successRate}%</span>
                  {successRate > 0 && (
                    <span className="trend positive">
                      <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill success" style={{ width: `${successRate}%` }}></div>
                </div>
              </div>
              <div className="analytics-stat">
                <span className="analytics-label">Trades This Month</span>
                <div className="analytics-value">
                  <span className="big-number">{stats.completedTrades + stats.activeTrades}</span>
                </div>
              </div>
              <div className="analytics-stat">
                <span className="analytics-label">Books Available</span>
                <div className="analytics-value">
                  <span className="big-number">{stats.booksListed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="dashboard-main">
          {/* Quick Stats */}
          <section className="stats-section">
            <div className="stats-grid">
              <Link to="/trades?status=pending" className="stat-card gradient-pink">
                <div className="stat-icon-container">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-value">{stats.pendingRequests}</p>
                  <p className="stat-label">Pending</p>
                </div>
                {stats.pendingRequests > 0 && (
                  <span className="stat-badge pulse">!</span>
                )}
              </Link>

              <Link to="/trades?status=active" className="stat-card gradient-amber">
                <div className="stat-icon-container">
                  <RefreshCw size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-value">{stats.activeTrades}</p>
                  <p className="stat-label">Active Trades</p>
                </div>
              </Link>

              <Link to="/trades?status=completed" className="stat-card gradient-blue">
                <div className="stat-icon-container">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-value">{stats.completedTrades}</p>
                  <p className="stat-label">Completed</p>
                </div>
              </Link>

              <Link to="/my-books" className="stat-card gradient-purple">
                <div className="stat-icon-container">
                  <BookOpen size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-value">{stats.booksListed}</p>
                  <p className="stat-label">Books Listed</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Activity Timeline */}
          {recentActivity.length > 0 && (
            <section className="activity-section glass-card">
              <div className="section-header">
                <h2><Bell size={18} /> Recent Activity</h2>
              </div>
              <div className="activity-timeline">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id || idx} className="activity-item">
                    <div className={`activity-dot ${activity.icon}`}></div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      {activity.book && (
                        <p className="activity-book">"{activity.book}"</p>
                      )}
                    </div>
                    <span className="activity-time">{getRelativeTime(activity.time)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending Trade Requests */}
          {pendingTrades.length > 0 && (
            <section className="pending-section">
              <div className="section-header">
                <h2><Clock size={18} /> Pending Requests</h2>
                <span className="badge pulse">{pendingTrades.length}</span>
              </div>
              <div className="pending-list">
                {pendingTrades.map(trade => (
                  <div key={trade._id} className="pending-card glass-card">
                    <div className="pending-books">
                      <div className="pending-book">
                        <img
                          src={trade.requestedBook?.imageUrl || '/placeholder-book.png'}
                          alt={trade.requestedBook?.title}
                        />
                        <div className="pending-book-info">
                          <span className="pending-book-label">Your book</span>
                          <p className="pending-book-title">{trade.requestedBook?.title}</p>
                        </div>
                      </div>
                      <div className="pending-swap">
                        <RefreshCw size={20} />
                      </div>
                      <div className="pending-book">
                        <img
                          src={trade.offeredBook?.imageUrl || '/placeholder-book.png'}
                          alt={trade.offeredBook?.title}
                        />
                        <div className="pending-book-info">
                          <span className="pending-book-label">From {trade.proposer?.name}</span>
                          <p className="pending-book-title">{trade.offeredBook?.title}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pending-actions">
                      <button
                        onClick={() => handleAcceptTrade(trade._id)}
                        className="btn-accept"
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineTrade(trade._id)}
                        className="btn-decline"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Trades */}
          {activeTrades.length > 0 && (
            <section className="trades-section">
              <div className="section-header">
                <h2><RefreshCw size={18} /> Active Trades</h2>
                <Link to="/trades" className="view-all-link">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="trades-carousel">
                {activeTrades.slice(0, 3).map(trade => {
                  const isProposer = trade.proposer._id === user._id;
                  const partner = isProposer ? trade.receiver : trade.proposer;
                  const myBook = isProposer ? trade.offeredBook : trade.requestedBook;
                  const theirBook = isProposer ? trade.requestedBook : trade.offeredBook;

                  return (
                    <div key={trade._id} className="trade-card glass-card">
                      <div className="trade-partner">
                        <div className="partner-avatar-small">
                          {partner?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="partner-name">{partner?.name}</p>
                          <span className="trade-status">In Progress</span>
                        </div>
                      </div>
                      <div className="trade-books-preview">
                        <img src={myBook?.imageUrl} alt={myBook?.title} className="trade-book-img" />
                        <span className="trade-swap-icon">⇄</span>
                        <img src={theirBook?.imageUrl} alt={theirBook?.title} className="trade-book-img" />
                      </div>
                      <Link to="/trades" className="trade-view-btn">
                        View Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recentBooks.length > 0 && (
        <section className="recommendations-section">
          <div className="section-header-wide">
            <div>
              <h2><Sparkles size={20} /> Discover New Books</h2>
              <p className="section-subtitle">Books available for trade in your community</p>
            </div>
            <Link to="/browse" className="view-all-link">
              Browse All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="recommendations-grid">
            {recentBooks.map(book => (
              <Link
                key={book._id}
                to={`/browse?bookId=${book._id}`}
                className="recommendation-card"
              >
                <div className="recommendation-image">
                  <img
                    src={book.imageUrl || '/placeholder-book.png'}
                    alt={book.title}
                  />
                  <div className="recommendation-overlay">
                    <button className="quick-action">
                      <Heart size={16} />
                    </button>
                  </div>
                </div>
                <div className="recommendation-info">
                  <h3>{book.title}</h3>
                  <p className="recommendation-author">{book.author}</p>
                  <p className="recommendation-owner">
                    <User size={12} />
                    {book.owner?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {stats.booksListed === 0 && pendingTrades.length === 0 && activeTrades.length === 0 && (
        <section className="empty-state-enhanced">
          <div className="empty-illustration">
            <Library size={64} />
          </div>
          <h2>Welcome to BookVerse!</h2>
          <p>Your book trading journey begins here. Add your first book to start trading with fellow book lovers.</p>
          <Link to="/books/create" className="btn-get-started">
            <Plus size={18} />
            Add Your First Book
          </Link>
        </section>
      )}

      {/* Floating Action Button - Only show if user has books */}
      {stats.booksListed > 0 && (
        <FloatingActionButton
          to="/books/create"
          icon={<Plus size={24} />}
          label="Add Book"
        />
      )}
    </div>
  );
};

export default DashboardPage;
