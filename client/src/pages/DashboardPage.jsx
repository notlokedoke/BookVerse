import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import {
  BookOpen, RefreshCw, CheckCircle, Clock, Plus, Search,
  Library, TrendingUp, ArrowRight, Calendar, Bell, Heart
} from 'lucide-react';
import FloatingActionButton from '../components/FloatingActionButton';
import RecommendedBooks from '../components/RecommendedBooks';
import { getBookImageUrl } from '../utils/imageUtils';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    booksListed: 0, activeTrades: 0, completedTrades: 0, pendingRequests: 0
  });
  const [pendingTrades, setPendingTrades] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [wishlistStats, setWishlistStats] = useState({
    totalItems: 0, matchesFound: 0, recentMatches: []
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

  const calculateProfileCompletion = () => {
    let done = 0;
    const total = user?.isOAuthUser ? 4 : 5;
    if (user?.name) done++;
    if (!user?.isOAuthUser && user?.emailVerified) done++;
    if (user?.city) done++;
    if (userBooks.length > 0 || allTrades.length > 0) done++;
    if (allTrades.some(t => t.status === 'completed')) done++;
    return Math.round((done / total) * 100);
  };

  const getProfileItems = () => {
    const items = [
      { label: 'Add your name', completed: !!user?.name },
      { label: 'Set your location', completed: !!user?.city },
      { label: 'List your first book', completed: userBooks.length > 0 || allTrades.length > 0 },
      { label: 'Complete a trade', completed: allTrades.some(t => t.status === 'completed') }
    ];
    if (!user?.isOAuthUser) {
      items.splice(1, 0, { label: 'Verify email', completed: !!user?.emailVerified });
    }
    return items;
  };

  const getTradeSuccessRate = () => {
    const completed = allTrades.filter(t => t.status === 'completed').length;
    const declined = allTrades.filter(t => t.status === 'declined').length;
    const total = completed + declined;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const getRecentActivity = () =>
    allTrades
      .map(trade => {
        const isProposer = trade.proposer._id === user?._id;
        return {
          id: trade._id,
          status: trade.status,
          title: isProposer
            ? `Trade ${trade.status} with ${trade.receiver?.name}`
            : `Trade ${trade.status} from ${trade.proposer?.name}`,
          book: trade.requestedBook?.title,
          time: new Date(trade.createdAt || Date.now()),
          icon: trade.status === 'completed' ? 'completed' : trade.status === 'accepted' ? 'active' : 'pending',
          link: '/trades'
        };
      })
      .sort((a, b) => b.time - a.time)
      .slice(0, 6);

  const getRelativeTime = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const cfg = { headers: { Authorization: `Bearer ${token}` } };

      const [tradesRes, booksRes, wishlistRes, matchesRes] = await Promise.all([
        axios.get('/api/trades', cfg),
        axios.get(`/api/books/user/${user._id}?limit=100&includeUnavailable=true`, cfg),
        axios.get('/api/wishlist', cfg),
        axios.get('/api/wishlist/matches', cfg)
      ]);

      const trades = tradesRes.data.data || [];
      setAllTrades(trades);

      const pending = trades.filter(t => t.status === 'proposed' && t.receiver._id === user._id);
      const active = trades.filter(t => t.status === 'accepted');
      const books = booksRes.data.data?.books || [];
      setUserBooks(books);

      const wishlistItems = wishlistRes.data.data || [];
      const matches = matchesRes.data.data || [];
      const totalMatches = matches.reduce((acc, m) => acc + m.matches.length, 0);

      setWishlistStats({ totalItems: wishlistItems.length, matchesFound: totalMatches, recentMatches: matches.slice(0, 3) });
      setStats({
        booksListed: books.length,
        activeTrades: active.length,
        completedTrades: trades.filter(t => t.status === 'completed').length,
        pendingRequests: pending.length
      });
      setPendingTrades(pending);
      setActiveTrades(active);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/trades/${tradeId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Trade accepted!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to accept trade');
    }
  };

  const handleDeclineTrade = async (tradeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/trades/${tradeId}/decline`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Trade declined');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to decline trade');
    }
  };

  const profileCompletion = calculateProfileCompletion();
  const successRate = getTradeSuccessRate();
  const recentActivity = getRecentActivity();
  const declinedCount = allTrades.filter(t => t.status === 'declined').length;
  const isEmpty = stats.booksListed === 0 && pendingTrades.length === 0 && activeTrades.length === 0;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-stats">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-section" />
          <div className="skeleton-section" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container page-enter">

      {/* Command Banner */}
      <section className="command-banner">
        <div className="command-identity">
          <div className="command-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="command-text">
            <h1>{getGreeting()}, <span className="command-name">{user?.name?.split(' ')[0] || 'there'}</span>!</h1>
            <p className="command-date"><Calendar size={13} />{getFormattedDate()}</p>
          </div>
        </div>

        <div className="command-stats-row">
          <Link to="/trades?status=pending" className={`cmd-pill${stats.pendingRequests > 0 ? ' cmd-pill-urgent' : ''}`}>
            <Clock size={13} />
            <strong>{stats.pendingRequests}</strong>
            <span>Pending</span>
          </Link>
          <Link to="/trades?status=active" className="cmd-pill">
            <RefreshCw size={13} />
            <strong>{stats.activeTrades}</strong>
            <span>Active</span>
          </Link>
          <Link to="/trades?status=completed" className="cmd-pill">
            <CheckCircle size={13} />
            <strong>{stats.completedTrades}</strong>
            <span>Done</span>
          </Link>
          <Link to="/my-books" className="cmd-pill">
            <BookOpen size={13} />
            <strong>{stats.booksListed}</strong>
            <span>Books</span>
          </Link>
          <Link to="/wishlist" className={`cmd-pill${wishlistStats.matchesFound > 0 ? ' cmd-pill-match' : ''}`}>
            <Heart size={13} />
            <strong>{wishlistStats.totalItems}</strong>
            <span>Wishlist</span>
            {wishlistStats.matchesFound > 0 && (
              <span className="cmd-match-dot">{wishlistStats.matchesFound}</span>
            )}
          </Link>
        </div>

        <div className="command-ctas">
          {stats.pendingRequests > 0 ? (
            <Link to="/trades?status=pending" className="cmd-cta-primary">
              <Bell size={14} /> Review {stats.pendingRequests}
            </Link>
          ) : (
            <Link to="/browse" className="cmd-cta-ghost">
              <Search size={14} /> Browse
            </Link>
          )}
          <Link to="/books/create" className="cmd-cta-ghost">
            <Plus size={14} /> Add Book
          </Link>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="bento-grid">

        {/* Pending Requests — 2/3 width */}
        <section className="bento-cell bento-pending glass-card">
          <div className="section-header">
            <h2><Clock size={17} /> Pending Requests</h2>
            {pendingTrades.length > 0 && <span className="badge pulse">{pendingTrades.length}</span>}
          </div>
          {pendingTrades.length > 0 ? (
            <div className="pending-list">
              {pendingTrades.slice(0, 2).map(trade => (
                <div key={trade._id} className="pending-card">
                  <div className="pending-books">
                    <div className="pending-book">
                      <img src={getBookImageUrl(trade.requestedBook?.imageUrl)} alt={trade.requestedBook?.title} />
                      <div className="pending-book-info">
                        <span className="pending-book-label">Your book</span>
                        <p className="pending-book-title">{trade.requestedBook?.title}</p>
                      </div>
                    </div>
                    <div className="pending-swap"><RefreshCw size={17} /></div>
                    <div className="pending-book">
                      <img src={getBookImageUrl(trade.offeredBook?.imageUrl)} alt={trade.offeredBook?.title} />
                      <div className="pending-book-info">
                        <span className="pending-book-label">From {trade.proposer?.name}</span>
                        <p className="pending-book-title">{trade.offeredBook?.title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pending-actions">
                    <button onClick={() => handleAcceptTrade(trade._id)} className="btn-accept">
                      <CheckCircle size={15} /> Accept
                    </button>
                    <button onClick={() => handleDeclineTrade(trade._id)} className="btn-decline">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {pendingTrades.length > 2 && (
                <Link to="/trades?status=pending" className="bento-more-link">
                  +{pendingTrades.length - 2} more requests <ArrowRight size={13} />
                </Link>
              )}
            </div>
          ) : (
            <div className="bento-empty">
              <CheckCircle size={30} />
              <p>All caught up</p>
              <span>No pending trade requests</span>
            </div>
          )}
        </section>

        {/* Recent Activity — 1/3 width */}
        <section className="bento-cell bento-activity glass-card">
          <div className="section-header">
            <h2><Bell size={17} /> Activity</h2>
            <Link to="/activity" className="view-all-link">All <ArrowRight size={13} /></Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="activity-timeline">
              {recentActivity.map((item, idx) => (
                <Link key={item.id || idx} to={item.link} className="activity-item clickable">
                  <div className={`activity-dot ${item.icon}`} />
                  <div className="activity-content">
                    <p className="activity-title">{item.title}</p>
                    {item.book && <p className="activity-book">"{item.book}"</p>}
                  </div>
                  <span className="activity-time">{getRelativeTime(item.time)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bento-empty">
              <Bell size={30} />
              <p>No activity yet</p>
              <span>Your trades will appear here</span>
            </div>
          )}
        </section>

        {/* Active Trades — 2/3 width horizontal shelf */}
        <section className="bento-cell bento-trades glass-card">
          <div className="section-header">
            <h2><RefreshCw size={17} /> Active Trades</h2>
            {activeTrades.length > 0 && (
              <Link to="/trades" className="view-all-link">View All <ArrowRight size={13} /></Link>
            )}
          </div>
          {activeTrades.length > 0 ? (
            <div className="trades-shelf">
              {activeTrades.slice(0, 6).map(trade => {
                const isProposer = trade.proposer._id === user._id;
                const partner = isProposer ? trade.receiver : trade.proposer;
                const myBook = isProposer ? trade.offeredBook : trade.requestedBook;
                const theirBook = isProposer ? trade.requestedBook : trade.offeredBook;
                const daysAgo = Math.floor((Date.now() - new Date(trade.createdAt)) / 86400000);
                return (
                  <Link key={trade._id} to="/trades" className="shelf-trade-card glass-card">
                    <div className="shelf-books">
                      <img
                        src={getBookImageUrl(myBook?.imageUrl)} alt={myBook?.title}
                        className="shelf-book-img"
                        onError={e => { e.target.onerror = null; e.target.src = '/placeholder-book.svg'; }}
                      />
                      <span className="shelf-swap">⇄</span>
                      <img
                        src={getBookImageUrl(theirBook?.imageUrl)} alt={theirBook?.title}
                        className="shelf-book-img"
                        onError={e => { e.target.onerror = null; e.target.src = '/placeholder-book.svg'; }}
                      />
                    </div>
                    <div className="shelf-meta">
                      <div className="shelf-partner">
                        <div className="partner-avatar-small">{partner?.name?.charAt(0).toUpperCase()}</div>
                        <span className="shelf-partner-name">{partner?.name}</span>
                      </div>
                      <span className="shelf-age">{daysAgo === 0 ? 'Today' : `${daysAgo}d`}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bento-empty">
              <RefreshCw size={30} />
              <p>No active trades</p>
              <Link to="/browse" className="bento-empty-link">Browse books to trade</Link>
            </div>
          )}
        </section>

        {/* Analytics — 1/3 width */}
        <div className="bento-cell bento-analytics glass-card">
          <div className="section-header">
            <h2><TrendingUp size={17} /> Analytics</h2>
          </div>
          <div className="analytics-condensed">
            <div className="analytics-metric">
              <div className="analytics-metric-top">
                <span className="analytics-metric-label">Success Rate</span>
                <span className="analytics-metric-value">{successRate}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${successRate >= 80 ? 'success' : successRate >= 50 ? 'warning' : 'low'}`}
                  style={{ width: `${Math.max(successRate, 4)}%` }}
                />
              </div>
              <span className="analytics-metric-sub">
                {stats.completedTrades} completed · {declinedCount} declined
              </span>
            </div>

            <div className="analytics-metric-row">
              <div className="analytics-mini-stat">
                <span className="mini-stat-value">{stats.booksListed}</span>
                <span className="mini-stat-label">Listed</span>
              </div>
              <div className="analytics-mini-stat">
                <span className="mini-stat-value">{stats.activeTrades + stats.pendingRequests}</span>
                <span className="mini-stat-label">In Progress</span>
              </div>
              <div className="analytics-mini-stat">
                <span className="mini-stat-value">{stats.completedTrades}</span>
                <span className="mini-stat-label">Completed</span>
              </div>
            </div>

            {profileCompletion < 100 && (
              <div className="analytics-profile-strip">
                <div className="analytics-profile-header">
                  <span>Profile completion</span>
                  <span className="profile-pct">{profileCompletion}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill success" style={{ width: `${profileCompletion}%` }} />
                </div>
                <ul className="profile-checklist-mini">
                  {getProfileItems().filter(i => !i.completed).slice(0, 3).map((item, idx) => (
                    <li key={idx}><CheckCircle size={11} /> {item.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Matches — full width, conditional */}
        {wishlistStats.matchesFound > 0 && (
          <section className="bento-cell bento-wishlist glass-card">
            <div className="section-header">
              <h2><Heart size={17} /> Wishlist Matches</h2>
              <Link to="/wishlist" className="view-all-link">View All <ArrowRight size={13} /></Link>
            </div>
            <p className="wishlist-matches-subtitle">
              {wishlistStats.matchesFound} {wishlistStats.matchesFound === 1 ? 'book' : 'books'} from your wishlist {wishlistStats.matchesFound === 1 ? 'is' : 'are'} now available!
            </p>
            <div className="wishlist-matches-grid">
              {wishlistStats.recentMatches.map((match, idx) => (
                <div key={idx} className="wishlist-match-card">
                  <div className="wishlist-match-header">
                    <span className="wishlist-match-label">Looking for:</span>
                    <h4>{match.wishlistItem.title}</h4>
                  </div>
                  <div className="wishlist-match-books">
                    {match.matches.slice(0, 2).map(book => (
                      <Link key={book._id} to={`/browse?bookId=${book._id}`} className="wishlist-match-book">
                        <img src={getBookImageUrl(book.imageUrl)} alt={book.title} />
                        <div className="wishlist-match-book-info">
                          <p className="wishlist-match-book-title">{book.title}</p>
                          <p className="wishlist-match-book-owner">by {book.owner?.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {match.matches.length > 2 && (
                    <Link to="/wishlist" className="wishlist-match-more">
                      +{match.matches.length - 2} more {match.matches.length - 2 === 1 ? 'match' : 'matches'}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <RecommendedBooks limit={5} />

      {isEmpty && (
        <section className="empty-state-enhanced">
          <div className="empty-illustration"><Library size={64} /></div>
          <h2>Welcome to BookVerse!</h2>
          <p>Your book trading journey begins here. Add your first book to start trading with fellow book lovers.</p>
          <Link to="/books/create" className="btn-get-started">
            <Plus size={18} /> Add Your First Book
          </Link>
        </section>
      )}

      {stats.booksListed > 0 && (
        <FloatingActionButton to="/books/create" icon={<Plus size={24} />} label="Add Book" />
      )}
    </div>
  );
};

export default DashboardPage;
