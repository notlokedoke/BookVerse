import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './TradeProposalModal.css';

const TradeProposalModal = ({ isOpen, onClose, requestedBook }) => {
  const { user } = useAuth();
  const [userBooks, setUserBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch user's available books when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserBooks();
    }
  }, [isOpen, user]);

  const fetchUserBooks = async () => {
    try {
      setLoading(true);
      setError('');

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/books/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter only available books
          const availableBooks = data.data.filter(book => book.isAvailable);
          setUserBooks(availableBooks);
        } else {
          setError('Failed to load your books. Please try again.');
        }
      } else if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load your books. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching user books:', err);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBook) {
      setError('Please select a book to offer');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestedBook: requestedBook._id,
          offeredBook: selectedBook
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        // Handle all validation error cases
        const errorMessage = getErrorMessage(data.error, response.status);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error proposing trade:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to provide user-friendly error messages for all validation cases
  const getErrorMessage = (error, statusCode) => {
    if (!error) {
      return 'Failed to propose trade. Please try again.';
    }

    // Handle specific error codes with user-friendly messages
    switch (error.code) {
      case 'MISSING_REQUIRED_FIELDS':
        return 'Please select a book to offer for this trade.';
      
      case 'INVALID_BOOK_ID':
        return 'Invalid book selection. Please try again.';
      
      case 'REQUESTED_BOOK_NOT_FOUND':
        return 'The requested book is no longer available.';
      
      case 'OFFERED_BOOK_NOT_FOUND':
        return 'The book you selected is no longer available. Please refresh and try again.';
      
      case 'NOT_BOOK_OWNER':
        return 'You can only offer books that you own.';
      
      case 'CANNOT_REQUEST_OWN_BOOK':
        return 'You cannot propose a trade for your own book.';
      
      case 'REQUESTED_BOOK_UNAVAILABLE':
        return 'This book is no longer available for trade.';
      
      case 'OFFERED_BOOK_UNAVAILABLE':
        return 'The book you selected is no longer available. Please select another book.';
      
      case 'VALIDATION_ERROR':
        // Handle validation errors with details if available
        if (error.details && Array.isArray(error.details)) {
          return error.details.join('. ');
        }
        return error.message || 'Validation failed. Please check your input.';
      
      case 'NO_TOKEN':
      case 'INVALID_TOKEN':
        return 'Your session has expired. Please log in again.';
      
      case 'INTERNAL_ERROR':
        return 'A server error occurred. Please try again later.';
      
      default:
        // Use the error message from the server if available
        return error.message || 'Failed to propose trade. Please try again.';
    }
  };

  const handleClose = () => {
    setSelectedBook('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Propose Trade</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Trade Proposed Successfully!</h3>
            <p>The book owner will be notified of your trade proposal.</p>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="requested-book-info">
                <h3>You want to trade for:</h3>
                <div className="book-preview">
                  <img 
                    src={requestedBook.imageUrl} 
                    alt={requestedBook.title}
                    className="book-thumbnail"
                  />
                  <div className="book-details">
                    <h4>{requestedBook.title}</h4>
                    <p className="book-author">by {requestedBook.author}</p>
                    <span className="book-condition">{requestedBook.condition}</span>
                  </div>
                </div>
              </div>

              <div className="divider">
                <span>↓</span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="offered-book">Select a book to offer:</label>
                  
                  {loading ? (
                    <div className="loading-books">
                      <div className="spinner"></div>
                      <p>Loading your books...</p>
                    </div>
                  ) : userBooks.length === 0 ? (
                    <div className="no-books-message">
                      <p>You don't have any available books to offer.</p>
                      <p className="hint">Create a book listing first to propose trades.</p>
                    </div>
                  ) : (
                    <div className="books-grid">
                      {userBooks.map((book) => (
                        <div
                          key={book._id}
                          className={`book-option ${selectedBook === book._id ? 'selected' : ''}`}
                          onClick={() => setSelectedBook(book._id)}
                        >
                          <img 
                            src={book.imageUrl} 
                            alt={book.title}
                            className="book-option-image"
                          />
                          <div className="book-option-info">
                            <h5>{book.title}</h5>
                            <p className="book-option-author">{book.author}</p>
                            <span className="book-option-condition">{book.condition}</span>
                          </div>
                          {selectedBook === book._id && (
                            <div className="selected-indicator">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={submitting || !selectedBook || userBooks.length === 0}
                  >
                    {submitting ? 'Proposing...' : 'Propose Trade'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TradeProposalModal;
