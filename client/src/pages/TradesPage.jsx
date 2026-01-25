import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TradeCard from '../components/TradeCard';
import './TradesPage.css';

const TradesPage = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, incoming, outgoing

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

  // Filter trades based on active tab
  const getFilteredTrades = () => {
    if (!user) return [];

    switch (activeTab) {
      case 'incoming':
        return trades.filter(trade => trade.receiver?._id === user._id);
      case 'outgoing':
        return trades.filter(trade => trade.proposer?._id === user._id);
      default:
        return trades;
    }
  };

  const filteredTrades = getFilteredTrades();
  const incomingCount = trades.filter(trade => trade.receiver?._id === user?._id).length;
  const outgoingCount = trades.filter(trade => trade.proposer?._id === user?._id).length;

  if (loading) {
    return (
      <div className="trades-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your trades...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trades-page">
        <div className="container">
          <div className="error-state">
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
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>My Trades</h1>
            <p className="header-subtitle">
              Manage your trade proposals and exchanges
            </p>
          </div>
        </div>

        {/* Trades Summary */}
        <div className="trades-summary">
          <div className="summary-card">
            <div className="summary-number">{trades.length}</div>
            <div className="summary-label">Total Trades</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{incomingCount}</div>
            <div className="summary-label">Incoming</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{outgoingCount}</div>
            <div className="summary-label">Outgoing</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="trades-tabs">
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
        </div>

        {/* Trades List */}
        {filteredTrades.length > 0 ? (
          <div className="trades-grid">
            {filteredTrades.map((trade) => (
              <TradeCard key={trade._id} trade={trade} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <h3>
              {activeTab === 'incoming' && 'No Incoming Trades'}
              {activeTab === 'outgoing' && 'No Outgoing Trades'}
              {activeTab === 'all' && 'No Trades Yet'}
            </h3>
            <p>
              {activeTab === 'incoming' && 
                'You haven\'t received any trade proposals yet. Keep your books listed and wait for offers!'}
              {activeTab === 'outgoing' && 
                'You haven\'t proposed any trades yet. Browse books and start trading!'}
              {activeTab === 'all' && 
                'Start trading by browsing available books and proposing exchanges.'}
            </p>
            {activeTab !== 'incoming' && (
              <a href="/browse" className="browse-books-btn">
                Browse Books
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradesPage;
