import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import TradeCard from '../components/TradeCard';
import { RefreshCw, Clock, CheckCircle, XCircle, TrendingUp, Search } from 'lucide-react';
import './TradesPage.css';

const TradesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, incoming, outgoing
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, active, completed

  // Set initial status filter from URL parameter
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['pending', 'active', 'completed'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Update URL when status filter changes
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    if (status === 'all') {
      // Remove status parameter if showing all
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      // Update status parameter
      setSearchParams({ status });
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTrades(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to fetch trades');
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter trades based on active tab and status filter
  const getFilteredTrades = () => {
    if (!user) return [];

    let filtered = trades;

    // Apply tab filter (incoming/outgoing)
    switch (activeTab) {
      case 'incoming':
        filtered = filtered.filter(trade => trade.receiver?._id === user._id);
        break;
      case 'outgoing':
        filtered = filtered.filter(trade => trade.proposer?._id === user._id);
        break;
      default:
        // 'all' - no filtering by direction
        break;
    }

    // Apply status filter
    switch (statusFilter) {
      case 'pending':
        filtered = filtered.filter(trade => trade.status === 'proposed');
        break;
      case 'active':
        filtered = filtered.filter(trade => trade.status === 'accepted');
        break;
      case 'completed':
        filtered = filtered.filter(trade => trade.status === 'completed');
        break;
      default:
        // 'all' - no filtering by status
        break;
    }

    return filtered;
  };

  const filteredTrades = getFilteredTrades();
  const incomingCount = trades.filter(trade => trade.receiver?._id === user?._id).length;
  const outgoingCount = trades.filter(trade => trade.proposer?._id === user?._id).length;
  const pendingCount = trades.filter(trade => trade.status === 'proposed').length;
  const activeCount = trades.filter(trade => trade.status === 'accepted').length;
  const completedCount = trades.filter(trade => trade.status === 'completed').length;

  // Skeleton loading state
  if (loading) {
    return (
      <div className="trades-page">
        <div className="trades-container">
          <div className="trades-skeleton">
            <div className="skeleton-banner"></div>
            <div className="skeleton-header"></div>
            <div className="skeleton-stats">
              <div className="skeleton-stat-card"></div>
              <div className="skeleton-stat-card"></div>
              <div className="skeleton-stat-card"></div>
              <div className="skeleton-stat-card"></div>
            </div>
            <div className="skeleton-tabs"></div>
            <div className="skeleton-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trades-page">
        <div className="trades-container">
          <div className="error-state glass-card">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Trades</h2>
            <p>{error}</p>
            <button onClick={fetchTrades} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trades-page">
      <div className="trades-container">
        {/* Page Header */}
        <section className="page-header">
          <div className="header-icon-container">
            <RefreshCw size={28} />
          </div>
          <div className="header-text">
            <h1>My Trades</h1>
            <p className="header-subtitle">
              <TrendingUp size={14} />
              Manage your trade proposals and exchanges
            </p>
          </div>
        </section>

        {/* Trades Stats */}
        <section className="trades-stats">
          <button 
            className="stat-card gradient-pink clickable"
            onClick={() => handleStatusFilterChange('pending')}
          >
            <div className="stat-icon-container">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{pendingCount}</p>
              <p className="stat-label">Pending</p>
            </div>
            {pendingCount > 0 && (
              <span className="stat-badge pulse">!</span>
            )}
          </button>
          <button 
            className="stat-card gradient-amber clickable"
            onClick={() => handleStatusFilterChange('active')}
          >
            <div className="stat-icon-container">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{activeCount}</p>
              <p className="stat-label">Active</p>
            </div>
          </button>
          <button 
            className="stat-card gradient-blue clickable"
            onClick={() => handleStatusFilterChange('completed')}
          >
            <div className="stat-icon-container">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{completedCount}</p>
              <p className="stat-label">Completed</p>
            </div>
          </button>
          <button 
            className="stat-card gradient-purple clickable"
            onClick={() => handleStatusFilterChange('all')}
          >
            <div className="stat-icon-container">
              <RefreshCw size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{trades.length}</p>
              <p className="stat-label">Total Trades</p>
            </div>
          </button>
        </section>

        {/* Tabs */}
        <section className="trades-tabs glass-card">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Trades
            <span className="tab-count">{trades.length}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'incoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('incoming')}
          >
            Incoming
            <span className="tab-count">{incomingCount}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'outgoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('outgoing')}
          >
            Outgoing
            <span className="tab-count">{outgoingCount}</span>
          </button>
        </section>

        {/* Trades List */}
        {filteredTrades.length > 0 ? (
          <section className="trades-section">
            <div className="trades-grid">
              {filteredTrades.map((trade) => (
                <TradeCard key={trade._id} trade={trade} />
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state glass-card">
            <div className="empty-illustration">
              <RefreshCw size={64} />
            </div>
            <h2>
              {activeTab === 'incoming' && 'No Incoming Trades'}
              {activeTab === 'outgoing' && 'No Outgoing Trades'}
              {activeTab === 'all' && 'No Trades Yet'}
            </h2>
            <p>
              {activeTab === 'incoming' &&
                'You haven\'t received any trade proposals yet. Keep your books listed and wait for offers!'}
              {activeTab === 'outgoing' &&
                'You haven\'t proposed any trades yet. Browse books and start trading!'}
              {activeTab === 'all' &&
                'Start trading by browsing available books and proposing exchanges.'}
            </p>
            {activeTab !== 'incoming' && (
              <Link to="/browse" className="btn-get-started">
                <Search size={18} />
                Browse Books
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradesPage;
