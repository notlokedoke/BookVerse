import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import TradeCard from '../components/TradeCard';
import { RefreshCw, Search, TrendingUp } from 'lucide-react';
import './TradesPage.css';

const TradesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

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
        setError('Authentication required. Please log in again.');
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
        // Handle specific error cases
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(data.error?.message || 'Failed to fetch trades');
        }
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    if (activeTab === 'incoming') {
      filtered = filtered.filter(trade => trade.receiver?._id === user?._id);
    }

    if (activeTab === 'outgoing') {
      filtered = filtered.filter(trade => trade.proposer?._id === user?._id);
    }

    return filtered;
  }, [trades, activeTab, user]);

  // Global counts for stat cards
  const incomingCount = trades.filter(trade => trade.receiver?._id === user?._id).length;
  const outgoingCount = trades.filter(trade => trade.proposer?._id === user?._id).length;

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
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={fetchTrades} className="retry-btn">
                Try Again
              </button>
              {error.includes('Authentication') || error.includes('session') ? (
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                  }} 
                  className="retry-btn"
                  style={{ background: 'var(--primary-color)' }}
                >
                  Log In Again
                </button>
              ) : null}
            </div>
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

        {trades.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-illustration">
              <RefreshCw size={64} />
            </div>
            <h2>No Trades Yet</h2>
            <p>Start trading by browsing available books and proposing exchanges.</p>
            <Link to="/browse" className="btn-get-started">
              <Search size={18} />
              Browse Books
            </Link>
          </div>
        ) : (
          <>
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

            <section className="trades-section">
              {filteredTrades.length > 0 ? (
                <div className="trades-grid">
                  {filteredTrades.map((trade) => (
                    <TradeCard key={trade._id} trade={trade} />
                  ))}
                </div>
              ) : (
                <div className="empty-state glass-card">
                  <div className="empty-illustration">
                    <RefreshCw size={64} />
                  </div>
                  <h2>No Trades Found</h2>
                  <p>Try switching tabs or clearing filters to see more trades.</p>
                  <button
                    className="btn-get-started"
                    onClick={() => {
                      setActiveTab('all');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default TradesPage;
