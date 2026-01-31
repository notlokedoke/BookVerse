import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Spinner } from './ui';
import ChatBox from './ChatBox';
import RatingForm from './RatingForm';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ArrowRightLeft,
  BookOpen,
  User,
  Shield
} from 'lucide-react';
import './TradeDetailView.css';

const TradeDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    fetchTradeDetails();
  }, [id]);

  useEffect(() => {
    if (trade && trade.status === 'completed') {
      fetchUserRating();
    }
  }, [trade]);

  const fetchTradeDetails = async () => {
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
        const foundTrade = data.data.find(t => t._id === id);
        if (foundTrade) {
          setTrade(foundTrade);
        } else {
          setError('Trade not found');
        }
      } else {
        setError(data.error?.message || 'Failed to fetch trade details');
      }
    } catch (err) {
      console.error('Error fetching trade details:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    try {
      setRatingLoading(true);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) return;

      const response = await fetch(`${apiUrl}/api/ratings/trade/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserRating(data.data);
      } else if (response.status === 404) {
        setUserRating(null);
      }
    } catch (err) {
      console.error('Error fetching user rating:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleRatingSuccess = (rating) => {
    setUserRating(rating);
    setShowRatingForm(false);
    toast.success('Rating submitted successfully!');
  };

  const handleAcceptTrade = async () => {
    if (!trade || actionLoading) return;

    try {
      setActionLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/trades/${trade._id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Trade accepted successfully!');
        setTrade(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to accept trade');
      }
    } catch (err) {
      console.error('Error accepting trade:', err);
      toast.error('Unable to accept trade. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineTrade = async () => {
    if (!trade || actionLoading) return;

    if (!window.confirm('Are you sure you want to decline this trade proposal?')) {
      return;
    }

    try {
      setActionLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/trades/${trade._id}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Trade declined');
        setTrade(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to decline trade');
      }
    } catch (err) {
      console.error('Error declining trade:', err);
      toast.error('Unable to decline trade. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrade = async () => {
    if (!trade || actionLoading) return;

    if (!window.confirm('Are you sure you want to mark this trade as complete? This action confirms that the physical book exchange has been completed.')) {
      return;
    }

    try {
      setActionLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/trades/${trade._id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Trade marked as complete!');
        setTrade(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to complete trade');
      }
    } catch (err) {
      console.error('Error completing trade:', err);
      toast.error('Unable to complete trade. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="trade-detail-page">
        <div className="trade-detail-container">
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="trade-detail-page">
        <div className="trade-detail-container">
          <div className="glass-card text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              {error || 'Trade Not Found'}
            </h2>
            <p className="text-neutral-600 mb-6">
              {error || 'The trade you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/trades')}>
              Back to Trades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isProposer = user?._id === trade.proposer?._id;
  const isReceiver = user?._id === trade.receiver?._id;
  const otherUser = isProposer ? trade.receiver : trade.proposer;

  return (
    <div className="trade-detail-page">
      <div className="trade-detail-container">

        {/* Premium Header */}
        <div className="page-header-premium">
          <div className="header-content">
            <div className="header-title-row">
              <button onClick={() => navigate('/trades')} className="back-button">
                <ArrowLeft size={28} />
              </button>
              <h1 className="header-title">Trade Details</h1>
              <div className={`header-badge ${trade.status}`}>
                {trade.status}
              </div>
            </div>
            <div className="header-subtitle">
              <Clock size={16} />
              <span>Proposed on {formatDate(trade.proposedAt)}</span>
            </div>
          </div>
        </div>

        <div className="trade-content-grid">
          {/* Left Column - Main Content */}
          <div className="trade-main-col">
            {/* Books Exchange Section */}
            <div className="glass-card">
              <div className="section-title">
                <ArrowRightLeft size={24} className="text-primary" />
                <span>Books Exchange</span>
              </div>

              <div className="exchange-container">
                {/* My Offer (or Proposer's Offer) */}
                <div className="exchange-side">
                  <div className="exchange-side-header">
                    <span className="user-badge">{isProposer ? 'You Offer' : `${trade.proposer?.name} Offers`}</span>
                  </div>
                  <div className="book-card">
                    <div className="book-image-container">
                      <img
                        src={trade.offeredBook?.imageUrl}
                        alt={trade.offeredBook?.title}
                        className="book-image"
                        onError={(e) => { e.target.src = '/placeholder-book.png'; }}
                      />
                    </div>
                    <div className="book-info-section">
                      <h3 className="book-title">{trade.offeredBook?.title}</h3>
                      <p className="book-author">by {trade.offeredBook?.author}</p>
                    </div>
                  </div>
                </div>

                {/* Exchange Status Icon */}
                <div className="exchange-icon-container">
                  <ArrowRightLeft size={24} />
                </div>

                {/* Their Offer (or Receiver's Request) */}
                <div className="exchange-side">
                  <div className="exchange-side-header">
                    <span className="user-badge">{isProposer ? 'You Want' : `${otherUser?.name} Wants`}</span>
                  </div>
                  <div className="book-card">
                    <div className="book-image-container">
                      <img
                        src={trade.requestedBook?.imageUrl}
                        alt={trade.requestedBook?.title}
                        className="book-image"
                        onError={(e) => { e.target.src = '/placeholder-book.png'; }}
                      />
                    </div>
                    <div className="book-info-section">
                      <h3 className="book-title">{trade.requestedBook?.title}</h3>
                      <p className="book-author">by {trade.requestedBook?.author}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            {trade.status === 'accepted' && (
              <div className="mt-8">
                <ChatBox
                  tradeId={trade._id}
                  otherUserName={otherUser?.name}
                />
              </div>
            )}

            {/* Rating Section (Completed Trades) - Moved to main column bottom */}
            {trade.status === 'completed' && (isProposer || isReceiver) && (
              <div className="glass-card mt-8">
                <div className="section-title">
                  <Star size={24} className="text-primary" />
                  <span>Rate Experience</span>
                </div>

                {ratingLoading ? (
                  <div className="flex justify-center p-8"><Spinner /></div>
                ) : userRating ? (
                  <div className="status-banner success mb-0">
                    <div className="status-icon">✓</div>
                    <div className="status-content">
                      <h3>Rating Submitted</h3>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= userRating.stars ? "text-warning-500 fill-warning-500" : "text-neutral-300"}
                          />
                        ))}
                      </div>
                      {userRating.comment && <p className="mt-2 italic">"{userRating.comment}"</p>}
                    </div>
                  </div>
                ) : showRatingForm ? (
                  <RatingForm
                    tradeId={trade._id}
                    onSuccess={handleRatingSuccess}
                    onCancel={() => setShowRatingForm(false)}
                  />
                ) : (
                  <div>
                    <p className="text-neutral-600 mb-6">How was your exchange with {otherUser?.name}?</p>
                    <Button variant="primary" onClick={() => setShowRatingForm(true)}>
                      Rate {otherUser?.name}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="trade-sidebar-col">
            {/* Action Banners / Buttons - Priority 1 */}
            <div className="sidebar-group">
              {/* Status Hints */}
              {isProposer && trade.status === 'proposed' && (
                <div className="status-banner info compact">
                  <div className="status-icon">⏳</div>
                  <div className="status-content">
                    <h3>Pending</h3>
                    <p>Waiting for {otherUser?.name} to respond.</p>
                  </div>
                </div>
              )}

              {/* Responder Actions */}
              {isReceiver && trade.status === 'proposed' && (
                <div className="glass-card mb-6 highlight-card">
                  <div className="section-title small">
                    <Shield size={20} className="text-primary" />
                    <span>Response Required</span>
                  </div>
                  <div className="action-buttons-vertical">
                    <button
                      onClick={handleAcceptTrade}
                      disabled={actionLoading}
                      className="btn-large btn-primary-gradient w-full"
                    >
                      {actionLoading ? <Spinner size="sm" /> : <><CheckCircle size={20} /> Accept Trade</>}
                    </button>
                    <button
                      onClick={handleDeclineTrade}
                      disabled={actionLoading}
                      className="btn-large btn-outline-danger w-full"
                    >
                      {actionLoading ? <Spinner size="sm" /> : <><XCircle size={20} /> Decline Trade</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Completion Action */}
              {trade.status === 'accepted' && (isProposer || isReceiver) && (
                <div className="glass-card mb-6 highlight-card">
                  <div className="section-title small">
                    <CheckCircle size={20} className="text-primary" />
                    <span>Complete Trade</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-4">
                    Mark as complete after physical exchange.
                  </p>
                  <button
                    onClick={handleCompleteTrade}
                    disabled={actionLoading}
                    className="btn-large btn-primary-gradient w-full"
                  >
                    {actionLoading ? <Spinner size="sm" /> : <><CheckCircle size={20} /> Mark Complete</>}
                  </button>
                </div>
              )}
            </div>

            {/* Trading Partner Info */}
            <div className="glass-card mb-6">
              <div className="section-title small">
                <User size={20} className="text-primary" />
                <span>Trading Partner</span>
              </div>
              <div className="partner-card-content compact">
                <div className="partner-avatar">
                  {otherUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="partner-info">
                  <h3>{otherUser?.name}</h3>
                  <div className="partner-meta">
                    {otherUser?.city && otherUser?.privacySettings?.showCity !== false && (
                      <div className="partner-meta-item">
                        <MapPin size={14} />
                        {otherUser.city}
                      </div>
                    )}
                    {otherUser?.averageRating > 0 && (
                      <div className="partner-meta-item">
                        <Star size={14} className="text-warning-500 fill-warning-500" />
                        <span className="font-semibold">{otherUser.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="glass-card">
              <div className="section-title small">
                <Clock size={20} className="text-primary" />
                <span>Timeline</span>
              </div>
              <div className="timeline-list">
                <div className="timeline-item">
                  <span className="timeline-label">Proposed</span>
                  <span className="timeline-value">
                    {formatDate(trade.proposedAt)}
                  </span>
                </div>
                {trade.respondedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Responded</span>
                    <span className="timeline-value">
                      {formatDate(trade.respondedAt)}
                    </span>
                  </div>
                )}
                {trade.completedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Completed</span>
                    <span className="timeline-value">
                      {formatDate(trade.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailView;
