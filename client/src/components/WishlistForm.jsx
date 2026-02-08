import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, BookOpen, X, Check, Loader2 } from 'lucide-react';
import './WishlistForm.css';

const WishlistForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const searchTimeoutRef = useRef(null);

  // Handle Search Input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear timeout if there's one
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  const performSearch = async (query) => {
    setIsSearching(true);
    setErrors({});

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/books/search-external?q=${encodeURIComponent(query)}`);

      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      setErrors({ search: 'Unable to connect to book search service' });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchQuery('');
    setSearchResults([]);
    setErrors({});
  };

  const handleClearSelection = () => {
    setSelectedBook(null);
    setNotes('');
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    if (!selectedBook) {
      setErrors({ general: 'Please select a book to add to your wishlist' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data to send matching the backend expectation
      const dataToSend = {
        title: selectedBook.title.trim()
      };

      if (selectedBook.author) {
        dataToSend.author = selectedBook.author.trim();
      }
      if (selectedBook.isbn) {
        dataToSend.isbn = selectedBook.isbn.trim();
      }
      if (notes && notes.trim()) {
        dataToSend.notes = notes.trim();
      }
      if (selectedBook.thumbnail) {
        dataToSend.imageUrl = selectedBook.thumbnail;
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/wishlist`, dataToSend);

      if (response.data.success) {
        setSuccessMessage('Book added to wishlist successfully!');

        // Call success callback immediately
        setTimeout(() => {
          if (onSuccess) onSuccess(response.data.data);
        }, 1500);
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          if (errorData.error.code === 'DUPLICATE_WISHLIST_ITEM') {
            setErrors({ general: errorData.error.message });
          } else {
            setErrors({ general: errorData.error.message || 'Failed to add book to wishlist.' });
          }
        } else {
          setErrors({ general: 'Failed to add book to wishlist. Please try again.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wishlist-form-container">
      <div className="wishlist-form-header">
        <h2>Add Book to Wishlist</h2>
        <p>Find books you're looking for to help other users spot potential trades</p>
      </div>

      <div className="wishlist-form-content">
        {successMessage && (
          <div className="success-message">
            <Check size={18} /> {successMessage}
          </div>
        )}

        {errors.general && (
          <div className="error-message">
            {errors.general}
          </div>
        )}

        {!selectedBook ? (
          // SEARCH STATE
          <div className="wishlist-search-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="wishlist-search-input"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
              {isSearching && <Loader2 className="loading-icon rotating" size={20} />}
            </div>

            {errors.search && <p className="field-error">{errors.search}</p>}

            <div className="search-results-container">
              {searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearching && (
                <div className="no-results">
                  <BookOpen size={30} />
                  <p>No books found for "{searchQuery}"</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <ul className="search-results-list">
                  {searchResults.map((book) => (
                    <li key={book.id} className="search-result-item" onClick={() => handleSelectBook(book)}>
                      <div className="result-img">
                        {book.thumbnail ? (
                          <img src={book.thumbnail} alt={book.title} />
                        ) : (
                          <div className="missing-cover"><BookOpen size={24} /></div>
                        )}
                      </div>
                      <div className="result-info">
                        <h4>{book.title}</h4>
                        <p className="result-author">{book.author}</p>
                        {book.isbn && <span className="result-isbn">ISBN: {book.isbn}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {onCancel && (
              <div className="form-actions form-actions-top">
                <button type="button" className="cancel-btn" onClick={onCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          // CONFIRMATION STATE
          <form onSubmit={handleSubmit} className="wishlist-confirm-section">
            <div className="selected-book-card">
              <div className="selected-book-info">
                <div className="result-img">
                  {selectedBook.thumbnail ? (
                    <img src={selectedBook.thumbnail} alt={selectedBook.title} />
                  ) : (
                    <div className="missing-cover"><BookOpen size={24} /></div>
                  )}
                </div>
                <div className="details">
                  <h3>{selectedBook.title}</h3>
                  <p className="author-name">{selectedBook.author}</p>
                  {selectedBook.isbn && <p className="isbn">ISBN: {selectedBook.isbn}</p>}
                </div>
                <button
                  type="button"
                  className="clear-selection-btn"
                  onClick={handleClearSelection}
                  aria-label="Remove selection"
                  disabled={isSubmitting}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="form-group notes-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="E.g., Prefer hardcover, specific edition, must be at least Good condition, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows="3"
                maxLength="500"
              />
              <small>Add any specific preferences or conditions for acceptable trades.</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleClearSelection}
                disabled={isSubmitting}
              >
                Back to Search
              </button>
              <button
                type="submit"
                className="add-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Save to Wishlist'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WishlistForm;