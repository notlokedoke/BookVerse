import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import TradeProposalModal from './TradeProposalModal';
import EditBookModal from './EditBookModal';
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

          {/* Additional Images Gallery */}
          {(book.frontImageUrl || book.backImageUrl || book.googleBooksImageUrl) && (
            <div className="additional-images-gallery">
              {book.googleBooksImageUrl && (
                <div className="gallery-item">
                  <img src={book.googleBooksImageUrl} alt="Google Books cover" />
                  <span className="gallery-label">Cover</span>
                </div>
              )}
              {book.frontImageUrl && (
                <div className="gallery-item">
                  <img src={book.frontImageUrl} alt="Front view" />
                  <span className="gallery-label">Front</span>
                </div>
              )}
              {book.backImageUrl && (
                <div className="gallery-item">
                  <img src={book.backImageUrl} alt="Back view" />
                  <span className="gallery-label">Back</span>
                </div>
              )}
            </div>
          )}
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
                {isAuthenticated ? (
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
                ) : (
                  <div className="owner-info-guest">
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
                <button 
                  className="propose-trade-button"
                  disabled={!book.isAvailable}
                  onClick={() => setIsModalOpen(true)}
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