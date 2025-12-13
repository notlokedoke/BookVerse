import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BookDetailView.css';

const BookDetailView = () => {
  const { bookId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError('');

        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/books/${bookId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBook(data.data);
          } else {
            setError('Failed to load book details');
          }
        } else if (response.status === 404) {
          setError('Book not found');
        } else {
          setError('Failed to load book details');
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get condition color class
  const getConditionClass = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'new':
        return 'condition-new';
      case 'like new':
        return 'condition-like-new';
      case 'good':
        return 'condition-good';
      case 'fair':
        return 'condition-fair';
      case 'poor':
        return 'condition-poor';
      default:
        return 'condition-default';
    }
  };

  if (loading) {
    return (
      <div className="book-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="book-detail-container">
        <div className="error-state">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-detail-container">
        <div className="error-state">
          <h2>Book not found</h2>
          <p>The book you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && book.owner && user._id === book.owner._id;

  return (
    <div className="book-detail-container">
      {/* Header with back button */}
      <div className="detail-header">
        <button 
          onClick={() => navigate(-1)}
          className="back-button"
        >
          ← Back
        </button>
      </div>

      <div className="book-detail-content">
        {/* Book Image Section */}
        <div className="book-image-section">
          <div className="book-image-container">
            <img
              src={book.imageUrl}
              alt={`${book.title} by ${book.author}`}
              className="book-detail-image"
              onError={(e) => {
                e.target.src = '/placeholder-book.png'; // Fallback image
              }}
            />
            <div className={`condition-badge ${getConditionClass(book.condition)}`}>
              {book.condition}
            </div>
          </div>
        </div>

        {/* Book Information Section */}
        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title">{book.title}</h1>
            <p className="book-author">by {book.author}</p>
            
            <div className="book-meta-tags">
              <span className="genre-tag">{book.genre}</span>
              {book.isbn && (
                <span className="isbn-tag">ISBN: {book.isbn}</span>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="book-details-grid">
            <div className="detail-item">
              <label>Condition</label>
              <span className={`condition-value ${getConditionClass(book.condition)}`}>
                {book.condition}
              </span>
            </div>

            <div className="detail-item">
              <label>Genre</label>
              <span>{book.genre}</span>
            </div>

            {book.publicationYear && (
              <div className="detail-item">
                <label>Publication Year</label>
                <span>{book.publicationYear}</span>
              </div>
            )}

            {book.publisher && (
              <div className="detail-item">
                <label>Publisher</label>
                <span>{book.publisher}</span>
              </div>
            )}

            <div className="detail-item">
              <label>Listed</label>
              <span>{formatDate(book.createdAt)}</span>
            </div>

            <div className="detail-item">
              <label>Availability</label>
              <span className={book.isAvailable ? 'available' : 'unavailable'}>
                {book.isAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="book-description">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>
          )}

          {/* Owner Information */}
          {book.owner && (
            <div className="owner-section">
              <h3>Book Owner</h3>
              <div className="owner-card">
                <Link to={`/profile/${book.owner._id}`} className="owner-link">
                  <div className="owner-info">
                    <h4 className="owner-name">{book.owner.name}</h4>
                    {book.owner.city && book.owner.privacySettings?.showCity !== false && (
                      <p className="owner-location">📍 {book.owner.city}</p>
                    )}
                    {book.owner.averageRating > 0 && (
                      <div className="owner-rating">
                        <span className="rating-stars">⭐</span>
                        <span className="rating-value">
                          {book.owner.averageRating.toFixed(1)} ({book.owner.ratingCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="view-profile-btn">
                    View Profile →
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {isOwner ? (
              <div className="owner-actions">
                <button className="edit-button">
                  Edit Listing
                </button>
                <button className="delete-button">
                  Delete Listing
                </button>
              </div>
            ) : (
              <div className="visitor-actions">
                <button 
                  className="propose-trade-button"
                  disabled={!book.isAvailable}
                >
                  {book.isAvailable ? 'Propose Trade' : 'Not Available'}
                </button>
                {book.owner && (
                  <Link 
                    to={`/profile/${book.owner._id}`}
                    className="view-owner-button"
                  >
                    View Owner's Books
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailView;