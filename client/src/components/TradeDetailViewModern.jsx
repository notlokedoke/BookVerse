import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from './ui';
import ChatBoxModern from './ChatBoxModern';
import RatingForm from './RatingForm';
import {
  ArrowLeft,
  MoreVertical,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Video,
  Info
} from 'lucide-react';
import './TradeDetailViewModern.css';

/**
 * Modern Trade Detail View - WhatsApp/Messenger Style
 * Features:
 * - Full-screen messaging interface
 * - Minimal header like WhatsApp
 * - Trade details in expandable bottom sheet
 * - Action buttons as floating elements
 * - Clean, modern design
 */
const TradeDetailViewModern = () => {
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
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
        setShowActions(false);
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
        setShowActions(false);
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
        setShowActions(false);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="trade-modern-page">
        <div className="trade-modern-loading">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="trade-modern-page">
        <div className="trade-modern-error">
          <div className="error-icon">⚠️</div>
          <h2>Trade Not Found</h2>
          <p>{error || 'The trade you\'re looking for doesn\'t exist.'}</p>
          <button onClick={() => navigate('/trades')} className="btn-back">
            Back to Trades
          </button>
        </div>
      </div>
    );
  }

  const isProposer = user?._id === trade.proposer?._id;
  const isReceiver = user?._id === trade.receiver?._id;
  const otherUser = isProposer ? trade.receiver : trade.proposer;

  return (
    <div className="trade-modern-page">
      {/* WhatsApp-style Header */}
      <div className="trade-modern-header">
        <div className="header-left">
          <button onClick={() => navigate('/trades')} className="back-btn-modern">
            <ArrowLeft size={24} />
          </button>
          
          <div className="user-info-header">
            <div className="user-avatar-header">
              {otherUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details-header">
              <h3 className="user-name-header">{otherUser?.name}</h3>
              <p className="user-status-header">
                {trade.status === 'proposed' && 'Trade Proposed'}
                {trade.status === 'accepted' && 'Trade Accepted'}
                {trade.status === 'completed' && 'Trade Completed'}
                {trade.status === 'declined' && 'Trade Declined'}
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Video call icon (placeholder for future) */}
          <button className="header-action-btn" title="Video Call (Coming Soon)">
            <Video size={22} />
          </button>
          
          {/* Phone call icon (placeholder for future) */}
          <button className="header-action-btn" title="Call (Coming Soon)">
            <Phone size={22} />
          </button>
          
          {/* Trade details toggle */}
          <button 
            className="header-action-btn"
            onClick={() => setShowTradeDetails(!showTradeDetails)}
            title="Trade Details"
          >
            <Info size={22} />
          </button>
          
          {/* More options */}
          <button 
            className="header-action-btn"
            onClick={() => setShowActions(!showActions)}
            title="Actions"
          >
            <MoreVertical size={22} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="trade-modern-content">
        {/* Chat Area */}
        <div className="chat-area-modern">
          <ChatBoxModern tradeId={trade._id} otherUserName={otherUser?.name} />
        </div>

        {/* Trade Details Bottom Sheet */}
        {showTradeDetails && (
          <>
            <div 
              className="bottom-sheet-overlay"
              onClick={() => setShowTradeDetails(false)}
            />
            <div className="bottom-sheet">
              <div className="bottom-sheet-handle" />
              
              <div className="bottom-sheet-content">
                <h2 className="bottom-sheet-title">Trade Details</h2>

                {/* Status Badge */}
                <div className={`status-badge-modern ${trade.status}`}>
                  {trade.status === 'proposed' && '⏳ Pending Response'}
                  {trade.status === 'accepted' && '✓ Accepted'}
                  {trade.status === 'completed' && '✓✓ Completed'}
                  {trade.status === 'declined' && '✗ Declined'}
                </div>

                {/* Books Exchange */}
                <div className="books-exchange-modern">
                  <div className="book-item-modern">
                    <span className="book-label-modern">
                      {isProposer ? 'You Offer' : `${trade.proposer?.name} Offers`}
                    </span>
                    <div className="book-card-modern">
                      <img 
                        src={trade.offeredBook?.imageUrl || '/placeholder-book.svg'} 
                        alt={trade.offeredBook?.title}
                        className="book-cover-modern"
                      />
                      <div className="book-info-modern">
                        <h4>{trade.offeredBook?.title}</h4>
                        <p>{trade.offeredBook?.author}</p>
                      </div>
                    </div>
                  </div>

                  <div className="exchange-arrow-modern">⇄</div>

                  <div className="book-item-modern">
                    <span className="book-label-modern">
                      {isProposer ? 'You Receive' : `${otherUser?.name} Receives`}
                    </span>
                    <div className="book-card-modern">
                      <img 
                        src={trade.requestedBook?.imageUrl || '/placeholder-book.svg'} 
                        alt={trade.requestedBook?.title}
                        className="book-cover-modern"
                      />
                      <div className="book-info-modern">
                        <h4>{trade.requestedBook?.title}</h4>
                        <p>{trade.requestedBook?.author}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partner Info */}
                <div className="partner-info-modern">
                  <h3>Trading Partner</h3>
                  <div className="partner-card-modern">
                    <div className="partner-avatar-modern">
                      {otherUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="partner-details-modern">
                      <h4>{otherUser?.name}</h4>
                      {otherUser?.city && otherUser?.privacySettings?.showCity !== false && (
                        <p className="partner-location">
                          <MapPin size={14} />
                          {otherUser.city}
                        </p>
                      )}
                      {otherUser?.averageRating > 0 && (
                        <p className="partner-rating">
                          <Star size={14} className="star-filled" />
                          {otherUser.averageRating.toFixed(1)} rating
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="timeline-modern">
                  <h3>Timeline</h3>
                  <div className="timeline-items">
                    <div className="timeline-item-modern">
                      <Clock size={16} />
                      <div>
                        <span className="timeline-label">Proposed</span>
                        <span className="timeline-date">{formatDate(trade.proposedAt)}</span>
                      </div>
                    </div>
                    {trade.respondedAt && (
                      <div className="timeline-item-modern">
                        <CheckCircle size={16} />
                        <div>
                          <span className="timeline-label">Responded</span>
                          <span className="timeline-date">{formatDate(trade.respondedAt)}</span>
                        </div>
                      </div>
                    )}
                    {trade.completedAt && (
                      <div className="timeline-item-modern">
                        <CheckCircle size={16} />
                        <div>
                          <span className="timeline-label">Completed</span>
                          <span className="timeline-date">{formatDate(trade.completedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Section for Completed Trades */}
                {trade.status === 'completed' && !userRating && (
                  <div className="rating-section-modern">
                    <h3>Rate Your Experience</h3>
                    <p>How was your exchange with {otherUser?.name}?</p>
                    <RatingForm
                      tradeId={trade._id}
                      onSuccess={handleRatingSuccess}
                    />
                  </div>
                )}

                {userRating && (
                  <div className="rating-submitted-modern">
                    <CheckCircle size={20} />
                    <span>Rating submitted</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Actions Menu */}
        {showActions && (
          <>
            <div 
              className="actions-overlay"
              onClick={() => setShowActions(false)}
            />
            <div className="actions-menu">
              {isReceiver && trade.status === 'proposed' && (
                <>
                  <button 
                    className="action-menu-item accept"
                    onClick={handleAcceptTrade}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={20} />
                    <span>Accept Trade</span>
                  </button>
                  <button 
                    className="action-menu-item decline"
                    onClick={handleDeclineTrade}
                    disabled={actionLoading}
                  >
                    <XCircle size={20} />
                    <span>Decline Trade</span>
                  </button>
                </>
              )}

              {trade.status === 'accepted' && (isProposer || isReceiver) && (
                <button 
                  className="action-menu-item complete"
                  onClick={handleCompleteTrade}
                  disabled={actionLoading}
                >
                  <CheckCircle size={20} />
                  <span>Mark as Complete</span>
                </button>
              )}

              <button 
                className="action-menu-item"
                onClick={() => setShowTradeDetails(true)}
              >
                <Info size={20} />
                <span>View Trade Details</span>
              </button>

              <button 
                className="action-menu-item cancel"
                onClick={() => setShowActions(false)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button for Pending Actions */}
      {isReceiver && trade.status === 'proposed' && (
        <div className="floating-action-banner">
          <div className="fab-content">
            <div className="fab-text">
              <strong>Trade Proposal</strong>
              <span>Respond to {trade.proposer?.name}'s proposal</span>
            </div>
            <div className="fab-actions">
              <button 
                className="fab-btn decline"
                onClick={handleDeclineTrade}
                disabled={actionLoading}
              >
                <XCircle size={18} />
                Decline
              </button>
              <button 
                className="fab-btn accept"
                onClick={handleAcceptTrade}
                disabled={actionLoading}
              >
                <CheckCircle size={18} />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {trade.status === 'accepted' && (isProposer || isReceiver) && (
        <div className="floating-action-banner single">
          <button 
            className="fab-btn-single"
            onClick={handleCompleteTrade}
            disabled={actionLoading}
          >
            <CheckCircle size={20} />
            Mark Trade as Complete
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeDetailViewModern;
