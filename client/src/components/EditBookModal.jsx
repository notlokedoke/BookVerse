import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditBookModal.css';

const EditBookModal = ({ book, isOpen, onClose, onBookUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    condition: '',
    genre: '',
    isbn: '',
    description: '',
    publicationYear: '',
    publisher: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLookingUpISBN, setIsLookingUpISBN] = useState(false);

  const { title, author, condition, genre, isbn, description, publicationYear, publisher } = formData;

  // Condition options based on Book model enum
  const conditionOptions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  // Common genre options
  const genreOptions = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Technology',
    'Health',
    'Travel',
    'Cooking',
    'Art',
    'Poetry',
    'Drama',
    'Children',
    'Young Adult',
    'Classic',
    'Other'
  ];

  // Populate form with book data when modal opens
  useEffect(() => {
    if (book && isOpen) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        condition: book.condition || '',
        genre: book.genre || '',
        isbn: book.isbn || '',
        description: book.description || '',
        publicationYear: book.publicationYear ? book.publicationYear.toString() : '',
        publisher: book.publisher || ''
      });
      setImagePreview(book.imageUrl || null);
      setImageFile(null);
      setErrors({});
      setSuccessMessage('');
    }
  }, [book, isOpen]);

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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({
          ...errors,
          image: 'Please select a valid image file'
        });
        return;
      }

      // Validate file size (3MB max)
      if (file.size > 3 * 1024 * 1024) {
        setErrors({
          ...errors,
          image: 'Image file must be less than 3MB'
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear image error
      if (errors.image) {
        setErrors({
          ...errors,
          image: ''
        });
      }
    }
  };

  // Handle ISBN lookup
  const handleISBNLookup = async () => {
    if (!isbn || isbn.trim().length === 0) {
      setErrors({
        ...errors,
        isbn: 'Please enter an ISBN to lookup'
      });
      return;
    }

    setIsLookingUpISBN(true);
    setErrors({
      ...errors,
      isbn: ''
    });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/books/isbn/${isbn.trim()}`);

      if (response.data.success) {
        const bookData = response.data.data;
        
        // Autofill form fields with the retrieved data
        setFormData({
          ...formData,
          title: bookData.title || formData.title,
          author: bookData.author || formData.author,
          publisher: bookData.publisher || formData.publisher,
          publicationYear: bookData.publicationYear ? bookData.publicationYear.toString() : formData.publicationYear,
          description: bookData.description || formData.description
        });

        setSuccessMessage('Book information retrieved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          setErrors({
            ...errors,
            isbn: errorData.error.message
          });
        } else {
          setErrors({
            ...errors,
            isbn: 'Failed to lookup book information'
          });
        }
      } else {
        setErrors({
          ...errors,
          isbn: 'Unable to connect to book lookup service'
        });
      }
    } finally {
      setIsLookingUpISBN(false);
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!condition) {
      newErrors.condition = 'Condition is required';
    }

    if (!genre.trim()) {
      newErrors.genre = 'Genre is required';
    }

    // Optional field validations
    if (isbn && isbn.trim()) {
      // Basic ISBN validation (10 or 13 digits, may contain hyphens)
      const isbnPattern = /^(?:\d{9}[\dX]|\d{13})$/;
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      if (!isbnPattern.test(cleanIsbn)) {
        newErrors.isbn = 'Please enter a valid ISBN (10 or 13 digits)';
      }
    }

    if (publicationYear && publicationYear.trim()) {
      const year = parseInt(publicationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1000 || year > currentYear + 1) {
        newErrors.publicationYear = `Publication year must be between 1000 and ${currentYear + 1}`;
      }
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
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('title', title.trim());
      formDataToSend.append('author', author.trim());
      formDataToSend.append('condition', condition);
      formDataToSend.append('genre', genre.trim());
      
      if (isbn && isbn.trim()) {
        formDataToSend.append('isbn', isbn.trim());
      }
      if (description && description.trim()) {
        formDataToSend.append('description', description.trim());
      }
      if (publicationYear && publicationYear.trim()) {
        formDataToSend.append('publicationYear', publicationYear.trim());
      }
      if (publisher && publisher.trim()) {
        formDataToSend.append('publisher', publisher.trim());
      }
      
      // Only append image if a new one was selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.put(`${apiUrl}/api/books/${book._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccessMessage('Book listing updated successfully!');
        
        // Call the callback to update the parent component
        if (onBookUpdated) {
          onBookUpdated(response.data.data);
        }
        
        // Close modal after 1 second
        setTimeout(() => {
          onClose();
        }, 1000);
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
          } else {
            setErrors({ general: errorData.error.message || 'Failed to update book listing. Please try again.' });
          }
        } else {
          setErrors({ general: 'Failed to update book listing. Please try again.' });
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

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="edit-book-modal">
        <div className="modal-header">
          <h2>Edit Book Listing</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
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
              <label htmlFor="edit-title">Book Title *</label>
              <input
                type="text"
                id="edit-title"
                name="title"
                placeholder="Enter the book title"
                value={title}
                onChange={handleChange}
                className={errors.title ? 'error' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-author">Author *</label>
              <input
                type="text"
                id="edit-author"
                name="author"
                placeholder="Enter the author's name"
                value={author}
                onChange={handleChange}
                className={errors.author ? 'error' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.author && <span className="field-error">{errors.author}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-condition">Condition *</label>
              <select
                id="edit-condition"
                name="condition"
                value={condition}
                onChange={handleChange}
                className={errors.condition ? 'error' : ''}
                disabled={isSubmitting}
                required
              >
                <option value="">Select condition</option>
                {conditionOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.condition && <span className="field-error">{errors.condition}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-genre">Genre *</label>
              <select
                id="edit-genre"
                name="genre"
                value={genre}
                onChange={handleChange}
                className={errors.genre ? 'error' : ''}
                disabled={isSubmitting}
                required
              >
                <option value="">Select genre</option>
                {genreOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.genre && <span className="field-error">{errors.genre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-image">Book Photo</label>
              <input
                type="file"
                id="edit-image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className={errors.image ? 'error' : ''}
                disabled={isSubmitting}
              />
              <small>Upload a new photo to replace the current one (max 3MB)</small>
              {errors.image && <span className="field-error">{errors.image}</span>}
              
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Book preview" />
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div className="optional-fields">
              <h3>Optional Information</h3>
              
              <div className="form-group">
                <label htmlFor="edit-isbn">ISBN</label>
                <div className="isbn-input-group">
                  <input
                    type="text"
                    id="edit-isbn"
                    name="isbn"
                    placeholder="Enter ISBN (10 or 13 digits)"
                    value={isbn}
                    onChange={handleChange}
                    className={errors.isbn ? 'error' : ''}
                    disabled={isSubmitting || isLookingUpISBN}
                  />
                  <button
                    type="button"
                    className="isbn-lookup-btn"
                    onClick={handleISBNLookup}
                    disabled={isSubmitting || isLookingUpISBN || !isbn.trim()}
                  >
                    {isLookingUpISBN ? 'Looking up...' : 'Lookup'}
                  </button>
                </div>
                <small>ISBN helps other readers identify the exact edition. Click "Lookup" to autofill book details.</small>
                {errors.isbn && <span className="field-error">{errors.isbn}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  placeholder="Describe the book's condition, any notes, or why you're trading it"
                  value={description}
                  onChange={handleChange}
                  className={errors.description ? 'error' : ''}
                  disabled={isSubmitting}
                  rows="4"
                />
                {errors.description && <span className="field-error">{errors.description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-publicationYear">Publication Year</label>
                  <input
                    type="number"
                    id="edit-publicationYear"
                    name="publicationYear"
                    placeholder="e.g., 2020"
                    value={publicationYear}
                    onChange={handleChange}
                    className={errors.publicationYear ? 'error' : ''}
                    disabled={isSubmitting}
                    min="1000"
                    max={new Date().getFullYear() + 1}
                  />
                  {errors.publicationYear && <span className="field-error">{errors.publicationYear}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-publisher">Publisher</label>
                  <input
                    type="text"
                    id="edit-publisher"
                    name="publisher"
                    placeholder="e.g., Penguin Books"
                    value={publisher}
                    onChange={handleChange}
                    className={errors.publisher ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.publisher && <span className="field-error">{errors.publisher}</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="update-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookModal;