import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './WishlistForm.css';

const WishlistForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { title, author, isbn, notes } = formData;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Optional field validations
    if (author && author.trim().length > 200) {
      newErrors.author = 'Author must be less than 200 characters';
    }

    if (isbn && isbn.trim()) {
      // Basic ISBN validation (10 or 13 digits, may contain hyphens)
      const isbnPattern = /^(?:\d{9}[\dX]|\d{13})$/;
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      if (!isbnPattern.test(cleanIsbn)) {
        newErrors.isbn = 'Please enter a valid ISBN (10 or 13 digits)';
      } else if (isbn.trim().length > 20) {
        newErrors.isbn = 'ISBN must be less than 20 characters';
      }
    }

    if (notes && notes.trim().length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data to send
      const dataToSend = {
        title: title.trim()
      };

      // Add optional fields if provided
      if (author && author.trim()) {
        dataToSend.author = author.trim();
      }
      if (isbn && isbn.trim()) {
        dataToSend.isbn = isbn.trim();
      }
      if (notes && notes.trim()) {
        dataToSend.notes = notes.trim();
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/wishlist`, dataToSend);

      if (response.data.success) {
        setSuccessMessage('Book added to wishlist successfully!');
        
        // Clear form
        setFormData({
          title: '',
          author: '',
          isbn: '',
          notes: ''
        });
        setErrors({});
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data.data);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        
        if (errorData.error) {
          if (errorData.error.code === 'VALIDATION_ERROR') {
            // Handle validation errors from server
            if (errorData.error.details) {
              const serverErrors = {};
              if (Array.isArray(errorData.error.details)) {
                errorData.error.details.forEach(err => {
                  if (err.path) {
                    serverErrors[err.path] = err.msg;
                  }
                });
              } else {
                // Handle mongoose validation errors
                Object.keys(errorData.error.details).forEach(field => {
                  serverErrors[field] = errorData.error.details[field].message;
                });
              }
              setErrors(serverErrors);
            } else {
              setErrors({ general: errorData.error.message });
            }
          } else if (errorData.error.code === 'DUPLICATE_WISHLIST_ITEM') {
            setErrors({ isbn: errorData.error.message });
          } else {
            setErrors({ general: errorData.error.message || 'Failed to add book to wishlist. Please try again.' });
          }
        } else {
          setErrors({ general: 'Failed to add book to wishlist. Please try again.' });
        }
      } else if (error.request) {
        // Request made but no response
        setErrors({ general: 'Unable to connect to server. Please check your connection.' });
      } else {
        // Something else happened
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
        <p>Add books you're looking for to help other users find potential trades</p>
      </div>

      <div className="wishlist-form-content">
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div className="error-message">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          {/* Required Fields */}
          <div className="form-group">
            <label htmlFor="title">Book Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Enter the book title you're looking for"
              value={title}
              onChange={handleChange}
              className={errors.title ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          {/* Optional Fields */}
          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              placeholder="Enter the author's name (optional)"
              value={author}
              onChange={handleChange}
              className={errors.author ? 'error' : ''}
              disabled={isSubmitting}
            />
            <small>Helps other users find the exact book you want</small>
            {errors.author && <span className="field-error">{errors.author}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              placeholder="Enter ISBN (10 or 13 digits, optional)"
              value={isbn}
              onChange={handleChange}
              className={errors.isbn ? 'error' : ''}
              disabled={isSubmitting}
            />
            <small>ISBN helps identify the exact edition you want</small>
            {errors.isbn && <span className="field-error">{errors.isbn}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Any specific notes about the edition or condition you prefer (optional)"
              value={notes}
              onChange={handleChange}
              className={errors.notes ? 'error' : ''}
              disabled={isSubmitting}
              rows="3"
            />
            <small>Add any specific preferences or notes about the book</small>
            {errors.notes && <span className="field-error">{errors.notes}</span>}
          </div>

          <div className="form-actions">
            {onCancel && (
              <button
                type="button"
                className="cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className="add-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding to Wishlist...' : 'Add to Wishlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WishlistForm;