import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import TradeProposalModal from './TradeProposalModal';
import EditBookModal from './EditBookModal';
import WishlistButton from './WishlistButton';
import { formatCityName } from '../utils/formatLocation';
import './BookDetailView.css';

const BookDetailView = () => {
  const { bookId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

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
            setError('Failed to load book details. Please refresh the page or try again later.');
          }
        } else if (response.status === 404) {
          setError('Book not found');
        } else {
          setError('Failed to load book details. Please refresh the page or try again later.');
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

  // Handle edit button click
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Handle book updated
  const handleBookUpdated = (updatedBook) => {
    setBook(updatedBook);
    showToast('Book listing updated successfully', 'success');
  };

  // Handle delete button click
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.delete(`${apiUrl}/api/books/${bookId}`);

      if (response.data.success) {
        showToast('Book listing deleted successfully', 'success');
        navigate('/my-books');
      }
    } catch (error) {
      console.error('Delete book error:', error);
      showToast(
        error.response?.data?.error?.message || 'Failed to delete book listing',
        'error'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
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
          aria-label="Go back"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      <div className="book-detail-content">
        {/* Book Hero Section - Image + Title */}
        <div className="book-hero-section">
          <div className="book-image-section">
            <div className="book-image-container">
              <img
                src={activeImage || book.imageUrl || '/placeholder-book.png'}
                alt={`${book.title} by ${book.author}`}
                className="book-detail-image"
                onError={(e) => {
                  e.target.src = '/placeholder-book.png';
                }}
              />
              <div className={`condition-badge ${getConditionClass(book.condition)}`}>
                {book.condition}
              </div>
            </div>

            {/* Additional Images Gallery - Show Google Books cover first */}
            <div className="additional-images-gallery">
              {book.googleBooksImageUrl && (
                <div 
                  className={`gallery-item ${(activeImage || book.imageUrl) === book.googleBooksImageUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(book.googleBooksImageUrl)}
                >
                  <img 
                    src={book.googleBooksImageUrl} 
                    alt={`${book.title} - Cover`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="gallery-label">Cover</span>
                </div>
              )}
              
              {book.frontImageUrl && (
                <div 
                  className={`gallery-item ${(activeImage === book.frontImageUrl) ? 'active' : ''}`}
                  onClick={() => setActiveImage(book.frontImageUrl)}
                >
                  <img 
                    src={book.frontImageUrl} 
                    alt={`${book.title} - Front`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="gallery-label">Actual Front</span>
                </div>
              )}
              
              {book.backImageUrl && (
                <div 
                  className={`gallery-item ${(activeImage === book.backImageUrl) ? 'active' : ''}`}
                  onClick={() => setActiveImage(book.backImageUrl)}
                >
                  <img 
                    src={book.backImageUrl} 
                    alt={`${book.title} - Back`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="gallery-label">Actual Back</span>
                </div>
              )}
              
              {/* Support for additional images if they exist */}
              {book.additionalImages && book.additionalImages.map((imgUrl, index) => (
                <div 
                  key={`additional-${index}`}
                  className={`gallery-item ${(activeImage === imgUrl) ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${book.title} - Image ${index + 1}`} />
                  <span className="gallery-label">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="book-header">
            <h1 className="book-title">{book.title}</h1>
            <p className="book-author">by {book.author}</p>
            
            <div className="book-meta-tags">
              {Array.isArray(book.genre) ? (
                book.genre.map((g, index) => (
                  <span key={index} className="genre-tag">{g}</span>
                ))
              ) : (
                <span className="genre-tag">{book.genre}</span>
              )}
              {book.isbn && (
                <span className="isbn-tag">ISBN: {book.isbn}</span>
              )}
            </div>

            {/* Description in Hero */}
            {book.description && (
              <div className="book-description-hero">
                <h3>Description</h3>
                <p>{book.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Book Information Cards */}
        <div className="book-info-section">
          <div className="book-details-grid">
            <div className="detail-item">
              <label>Condition</label>
              <span className={`condition-value ${getConditionClass(book.condition)}`}>
                {book.condition}
              </span>
            </div>

            <div className="detail-item">
              <label>Genre{Array.isArray(book.genre) && book.genre.length > 1 ? 's' : ''}</label>
              <span>{Array.isArray(book.genre) ? book.genre.join(', ') : book.genre}</span>
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

          {/* Owner Information */}
          {book.owner && (
            <div className="owner-section">
              <h3>Book Owner</h3>
              <div className="owner-card">
                {isAuthenticated ? (
                  <Link to={`/profile/${book.owner._id}`} className="owner-link">
                    <div className="owner-info">
                      <h4 className="owner-name">{book.owner.name}</h4>
                      {book.owner.city && book.owner.privacySettings?.showCity !== false && (
                        <p className="owner-location">📍 {formatCityName(book.owner.city)}</p>
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
                ) : (
                  <div className="owner-info-guest">
                    <div className="owner-info">
                      <h4 className="owner-name">{book.owner.name}</h4>
                      {book.owner.city && book.owner.privacySettings?.showCity !== false && (
                        <p className="owner-location">📍 {formatCityName(book.owner.city)}</p>
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
                    <div className="login-to-view">
                      <Link to="/login">Log in to view profile</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {!isAuthenticated ? (
              <div className="guest-actions">
                <div className="auth-prompt">
                  <h4>Want to trade this book?</h4>
                  <p>Sign up or log in to propose trades and connect with book owners.</p>
                  <div className="auth-buttons">
                    <Link to="/register" className="signup-button">
                      Sign Up to Trade
                    </Link>
                    <Link to="/login" className="login-button">
                      Log In
                    </Link>
                  </div>
                </div>
              </div>
            ) : isOwner ? (
              <div className="owner-actions">
                <button className="edit-button" onClick={handleEdit}>
                  Edit Listing
                </button>
                <button className="delete-button" onClick={handleDelete}>
                  Delete Listing
                </button>
              </div>
            ) : (
              <div className="visitor-actions">
                {book.isAvailable ? (
                  <button 
                    className="propose-trade-button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Propose Trade
                  </button>
                ) : (
                  <WishlistButton book={book} compact={false} showLabel={true} />
                )}
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

      {/* Trade Proposal Modal */}
      {book && (
        <TradeProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          requestedBook={book}
        />
      )}

      {/* Edit Book Modal */}
      {book && (
        <EditBookModal
          book={book}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onBookUpdated={handleBookUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal glass-card">
            <div className="modal-header">
              <h3>Delete Book Listing</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this book listing?</p>
              <div className="book-preview">
                <strong>"{book.title}"</strong> by {book.author}
              </div>
              <p className="warning-text">
                This action cannot be undone. The book will be permanently removed from your listings.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetailView;