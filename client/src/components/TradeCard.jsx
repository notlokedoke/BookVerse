import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TradeCard.css';

const TradeCard = ({ trade }) => {
  const { user } = useAuth();

  if (!trade) {
    return null;
  }

  const {
    _id,
    proposer,
    receiver,
    requestedBook,
    offeredBook,
    status,
    createdAt
  } = trade;

  // Determine if current user is the proposer or receiver
  const isProposer = user?._id === proposer?._id;
  const otherUser = isProposer ? receiver : proposer;
  const userBook = isProposer ? offeredBook : requestedBook;
  const otherBook = isProposer ? requestedBook : offeredBook;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'proposed':
        return 'status-proposed';
      case 'accepted':
        return 'status-accepted';
      case 'declined':
        return 'status-declined';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'proposed':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <Link to={`/trades/${_id}`} className="trade-card-link">
      <div className="trade-card">
        {/* Trade Header */}
        <div className="trade-header">
          <div className="trade-info">
            <span className="trade-type">
              {isProposer ? 'Outgoing Trade' : 'Incoming Trade'}
            </span>
            <span className="trade-date">{formatDate(createdAt)}</span>
          </div>
          <div className={`status-badge ${getStatusClass(status)}`}>
            {getStatusText(status)}
          </div>
        </div>

        {/* Trade Content */}
        <div className="trade-content">
          {/* Other User Info */}
          <div className="trade-user">
            <div className="user-label">
              {isProposer ? 'Trading with' : 'Proposed by'}
            </div>
            <div className="user-info">
              <span className="user-name">{otherUser?.name || 'Unknown User'}</span>
              {otherUser?.city && otherUser?.privacySettings?.showCity !== false && (
                <span className="user-location">📍 {otherUser.city}</span>
              )}
            </div>
          </div>

          {/* Books Exchange */}
          <div className="books-exchange">
            {/* User's Book */}
            <div className="book-section">
              <div className="book-label">
                {isProposer ? 'You offer' : 'They want'}
              </div>
              <div className="book-preview">
                <img
                  src={userBook?.imageUrl}
                  alt={userBook?.title}
                  className="book-thumbnail"
                  onError={(e) => {
                    e.target.src = '/placeholder-book.png';
                  }}
                />
                <div className="book-details">
                  <h4 className="book-title">{userBook?.title || 'Unknown Book'}</h4>
                  <p className="book-author">{userBook?.author || 'Unknown Author'}</p>
                  <span className="book-condition">{userBook?.condition}</span>
                </div>
              </div>
            </div>

            {/* Exchange Arrow */}
            <div className="exchange-arrow">
              <span>⇄</span>
            </div>

            {/* Other User's Book */}
            <div className="book-section">
              <div className="book-label">
                {isProposer ? 'You want' : 'They offer'}
              </div>
              <div className="book-preview">
                <img
                  src={otherBook?.imageUrl}
                  alt={otherBook?.title}
                  className="book-thumbnail"
                  onError={(e) => {
                    e.target.src = '/placeholder-book.png';
                  }}
                />
                <div className="book-details">
                  <h4 className="book-title">{otherBook?.title || 'Unknown Book'}</h4>
                  <p className="book-author">{otherBook?.author || 'Unknown Author'}</p>
                  <span className="book-condition">{otherBook?.condition}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Footer */}
        <div className="trade-footer">
          <span className="view-details">View Details →</span>
        </div>
      </div>
    </Link>
  );
};

export default TradeCard;
