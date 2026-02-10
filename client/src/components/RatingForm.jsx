import React, { useState } from 'react';
import { Button } from './ui';
import './RatingForm.css';

const RatingForm = ({ tradeId, onSuccess, onCancel }) => {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Client-side validation
  const validateForm = () => {
    if (stars === 0) {
      setError('Please select a star rating');
      return false;
    }

    if (stars <= 3 && (!comment || comment.trim().length === 0)) {
      setError('Comment is required for ratings of 3 stars or lower');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trade: tradeId,
          stars,
          comment: comment.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Call success callback
        if (onSuccess) {
          onSuccess(data.data);
        }
      } else {
        setError(data.error?.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Unable to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (rating) => {
    setStars(rating);
    setError(null);
  };

  const handleStarHover = (rating) => {
    setHoveredStar(rating);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const displayStars = hoveredStar || stars;

  return (
    <div className="rating-form">
      <form onSubmit={handleSubmit}>
        <div className="rating-form-content">
          {/* Star Rating Selector */}
          <div className="star-rating-section">
            <label className="form-label">Your Rating</label>
            <div className="star-selector">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`star-button ${rating <= displayStars ? 'active' : ''}`}
                  onClick={() => handleStarClick(rating)}
                  onMouseEnter={() => handleStarHover(rating)}
                  onMouseLeave={handleStarLeave}
                  aria-label={`Rate ${rating} star${rating !== 1 ? 's' : ''}`}
                >
                  <svg
                    className="star-icon"
                    fill={rating <= displayStars ? 'currentColor' : 'none'}
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
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="rating-text">
                {stars === 1 && 'Poor'}
                {stars === 2 && 'Fair'}
                {stars === 3 && 'Good'}
                {stars === 4 && 'Very Good'}
                {stars === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment Field - Required for low ratings */}
          <div className="comment-section">
            <label htmlFor="rating-comment" className="form-label">
              Comment {stars <= 3 && stars > 0 && <span className="required-indicator">*</span>}
            </label>
            {stars <= 3 && stars > 0 && (
              <p className="comment-hint">
                A comment is required for ratings of 3 stars or lower
              </p>
            )}
            <textarea
              id="rating-comment"
              className="comment-textarea"
              rows="4"
              placeholder="Share your experience with this trade..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError(null);
              }}
              required={stars <= 3 && stars > 0}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={stars === 0}
              loading={loading}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;
