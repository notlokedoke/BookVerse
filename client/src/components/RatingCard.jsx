import React from 'react';
import { Link } from 'react-router-dom';
import './RatingCard.css';

const RatingCard = ({ rating }) => {
  if (!rating) {
    return null;
  }

  const { stars, comment, createdAt, rater } = rating;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Render stars
  const renderStars = () => {
    const starElements = [];
    for (let i = 1; i <= 5; i++) {
      starElements.push(
        <svg
          key={i}
          className={`star-icon ${i <= stars ? 'filled' : 'empty'}`}
          fill={i <= stars ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    }
    return starElements;
  };

  return (
    <div className="rating-card">
      {/* Rating Header */}
      <div className="rating-header">
        <div className="rater-info">
          {rater ? (
            <Link to={`/profile/${rater._id}`} className="rater-link">
              <div className="rater-avatar">
                {rater.name ? rater.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="rater-details">
                <span className="rater-name">{rater.name || 'Anonymous'}</span>
                {rater.city && (
                  <span className="rater-location">{rater.city}</span>
                )}
              </div>
            </Link>
          ) : (
            <div className="rater-link">
              <div className="rater-avatar">?</div>
              <div className="rater-details">
                <span className="rater-name">Anonymous</span>
              </div>
            </div>
          )}
        </div>
        <div className="rating-date">
          {formatDate(createdAt)}
        </div>
      </div>

      {/* Star Rating */}
      <div className="rating-stars">
        {renderStars()}
      </div>

      {/* Comment */}
      {comment && (
        <div className="rating-comment">
          <p>{comment}</p>
        </div>
      )}
    </div>
  );
};

export default RatingCard;
