import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import GenreSelector from './GenreSelector';
import './BookListingFormImproved.css';

const BookListingFormImproved = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    condition: '',
    genres: [], // Changed from 'genre' to 'genres' array
    isbn: '',
    description: '',
    publicationYear: '',
    publisher: '',
    googleBooksImage: null,
    coverSource: null // Track where the cover came from
  });
  
  // Image state
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpISBN, setIsLookingUpISBN] = useState(false);

  // Open Library images work directly (CORS enabled)
  // No proxy needed!
  const [showISBNLookup, setShowISBNLookup] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Refs
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const submitInFlightRef = useRef(false);

  // Condition options with descriptions
  const conditionOptions = [
    { 
      value: 'Like New', 
      label: 'Like New', 
      icon: <svg width="1em" height="1em" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
      description: 'Minimal wear, excellent condition' 
    },
    { 
      value: 'Good', 
      label: 'Good', 
      icon: <svg width="1em" height="1em" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" /></svg>, 
      description: 'Some wear, fully readable' 
    },
    { 
      value: 'Fair', 
      label: 'Fair', 
      icon: <svg width="1em" height="1em" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, 
      description: 'Noticeable wear, still usable' 
    },
    { 
      value: 'Poor', 
      label: 'Poor', 
      icon: <svg width="1em" height="1em" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, 
      description: 'Heavy wear, may have damage' 
    }
  ];

  // Genre selection is now handled by GenreSelector component

  // Calculate completion percentage
  useEffect(() => {
    const fields = ['title', 'author', 'condition', 'genres'];
    const optionalFields = ['isbn', 'description', 'publicationYear', 'publisher'];
    
    let completed = 0;
    let total = fields.length + optionalFields.length + 1; // +1 for images
    
    fields.forEach(field => {
      if (field === 'genres') {
        if (formData.genres && formData.genres.length > 0) completed++;
      } else if (formData[field]?.trim()) {
        completed++;
      }
    });
    
    optionalFields.forEach(field => {
      if (formData[field]?.trim()) completed++;
    });
    
    if (images.length > 0 || formData.googleBooksImage) completed++;
    
    setCompletionPercentage(Math.round((completed / total) * 100));
  }, [formData, images]);


  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'title':
        if (!value?.trim()) error = 'Title is required';
        break;
      case 'author':
        if (!value?.trim()) error = 'Author is required';
        break;
      case 'condition':
        if (!value) error = 'Condition is required';
        break;
      case 'genres':
        if (!value || value.length === 0) error = 'At least one genre is required';
        break;
      case 'isbn':
        if (value?.trim()) {
          const cleanIsbn = value.replace(/[-\s]/g, '');
          if (!/^(?:\d{9}[\dX]|\d{13})$/.test(cleanIsbn)) {
            error = 'Invalid ISBN format';
          }
        }
        break;
      case 'publicationYear':
        if (value?.trim()) {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1000 || year > currentYear + 1) {
            error = `Year must be between 1000 and ${currentYear + 1}`;
          }
        }
        break;
      default:
        break;
    }

    return error;
  };

  // Handle field blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  // Process image files
  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          type: prev.length === 0 ? 'front' : 'back'
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Remove image
  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Reorder images
  const moveImage = (fromIndex, toIndex) => {
    setImages(prev => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  };


  // Handle ISBN lookup
  const handleISBNLookup = async () => {
    if (!formData.isbn?.trim()) {
      setErrors(prev => ({ ...prev, isbn: 'Please enter an ISBN' }));
      return;
    }

    setIsLookingUpISBN(true);
    setErrors(prev => ({ ...prev, isbn: '' }));

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Show progress message
      toast.info('Looking up book information...');
      
      const response = await axios.post(`${apiUrl}/api/books/isbn/${formData.isbn.trim()}`);

      if (response.data.success) {
        const bookData = response.data.data;
        const sources = response.data.meta?.sources || {};
        
        console.log('ISBN Lookup Response:', bookData);
        console.log('Title:', bookData.title);
        console.log('Author:', bookData.author);
        console.log('Description:', bookData.description);
        console.log('Description length:', bookData.description?.length);
        console.log('Thumbnail URL:', bookData.thumbnail);
        console.log('Data sources:', sources);
        
        // Store the original URL (not proxied) - proxy will be applied during display only
        const originalThumbnailUrl = bookData.thumbnail;
        
        // Update form data with all fields
        const newFormData = {
          ...formData,
          title: bookData.title || formData.title,
          author: bookData.author || formData.author,
          publisher: bookData.publisher || formData.publisher,
          publicationYear: bookData.publicationYear?.toString() || formData.publicationYear,
          description: bookData.description || formData.description,
          googleBooksImage: originalThumbnailUrl || null,
          coverSource: bookData.source || null
        };
        
        console.log('Setting form data:', newFormData);
        setFormData(newFormData);

        // Show success message with source information
        let successMsg = '✓ Book information retrieved';
        if (bookData.thumbnail) {
          successMsg += ' with cover image';
        }
        if (bookData.source) {
          successMsg += ` from ${bookData.source}`;
        }
        successMsg += '!';
        
        toast.success(successMsg);
        setShowISBNLookup(false);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Book not found';
      setErrors(prev => ({ ...prev, isbn: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setIsLookingUpISBN(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.author?.trim()) newErrors.author = 'Author is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.genres || formData.genres.length === 0) newErrors.genres = 'At least one genre is required';

    if (images.length === 0 && !formData.googleBooksImage) {
      newErrors.image = 'At least one image is required';
    }

    if (formData.isbn?.trim()) {
      const cleanIsbn = formData.isbn.replace(/[-\s]/g, '');
      if (!/^(?:\d{9}[\dX]|\d{13})$/.test(cleanIsbn)) {
        newErrors.isbn = 'Invalid ISBN format';
      }
    }

    if (formData.publicationYear?.trim()) {
      const year = parseInt(formData.publicationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1000 || year > currentYear + 1) {
        newErrors.publicationYear = `Year must be between 1000 and ${currentYear + 1}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save as draft
  const saveDraft = () => {
    localStorage.setItem('bookDraft', JSON.stringify({
      formData,
      images: images.map(img => ({ preview: img.preview, type: img.type })),
      timestamp: Date.now()
    }));
    toast.success('Draft saved!');
    setIsDraft(true);
  };

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('bookDraft');
    if (draft) {
      try {
        const { formData: savedData, timestamp } = JSON.parse(draft);
        // Only load if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setFormData(savedData);
          setIsDraft(true);
        } else {
          localStorage.removeItem('bookDraft');
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Hard guard against duplicate submits from rapid click/enter.
    if (submitInFlightRef.current || isSubmitting) {
      console.log('⚠️ Duplicate submission blocked');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    console.log('📤 Starting book submission...');
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('author', formData.author.trim());
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('genres', JSON.stringify(formData.genres)); // Send as JSON array
      
      if (formData.isbn?.trim()) formDataToSend.append('isbn', formData.isbn.trim());
      if (formData.description?.trim()) formDataToSend.append('description', formData.description.trim());
      if (formData.publicationYear?.trim()) formDataToSend.append('publicationYear', formData.publicationYear.trim());
      if (formData.publisher?.trim()) formDataToSend.append('publisher', formData.publisher.trim());
      
      images.forEach((img, index) => {
        if (index === 0) {
          formDataToSend.append('frontImage', img.file);
        } else if (index === 1) {
          formDataToSend.append('backImage', img.file);
        }
      });
      
      if (formData.googleBooksImage) {
        formDataToSend.append('googleBooksImageUrl', formData.googleBooksImage);
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      console.log('📡 Sending request to server...');
      const response = await axios.post(`${apiUrl}/api/books`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        console.log('✅ Book created successfully:', response.data.data._id);
        toast.success('Book listing created successfully!');
        localStorage.removeItem('bookDraft');
        
        // Navigate immediately to prevent any re-submission
        navigate('/my-books', { replace: true });
      }
    } catch (error) {
      console.error('❌ Book creation failed:', error);
      const errorMsg = error.response?.data?.error?.message || 'Failed to create listing';
      toast.error(errorMsg);
      setErrors({ general: errorMsg });
      
      // Reset submission state on error so user can retry
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="book-listing-improved">
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <span className="progress-text">{completionPercentage}% Complete</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Create Book Listing
          </h1>
          <p>Share your books with the BookVerse community</p>
        </div>
        {isDraft && (
          <div className="draft-badge">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Draft Saved
          </div>
        )}
      </div>


      <form onSubmit={handleSubmit} className="listing-form">
        {/* ISBN Lookup Section */}
        {showISBNLookup && (
          <div className="isbn-lookup-card">
            <div className="card-header">
              <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div>
                <h3>Quick Start with ISBN</h3>
                <p>Auto-fill book details instantly</p>
              </div>
            </div>
            <div className="isbn-input-group">
              <input
                type="text"
                name="isbn"
                placeholder="Enter ISBN (10 or 13 digits)"
                value={formData.isbn}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.isbn ? 'error' : ''}
                disabled={isLookingUpISBN}
              />
              <button
                type="button"
                onClick={handleISBNLookup}
                disabled={isLookingUpISBN || !formData.isbn?.trim()}
                className="lookup-btn"
              >
                {isLookingUpISBN ? (
                  <>
                    <span className="spinner" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Lookup
                  </>
                )}
              </button>
            </div>
            {errors.isbn && <span className="field-error">{errors.isbn}</span>}
            <button
              type="button"
              onClick={() => setShowISBNLookup(false)}
              className="manual-entry-btn"
            >
              Or enter details manually →
            </button>
          </div>
        )}

        {/* Book Details Section */}
        <div className="form-card">
          <div className="card-header">
            <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <h3>Book Details</h3>
              <p>Essential information about your book</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">
                Book Title <span className="required">*</span>
                <span className="tooltip" title="Enter the full title of the book">ⓘ</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., The Great Gatsby"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.title ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="author">
                Author <span className="required">*</span>
                <span className="tooltip" title="Enter the author's full name">ⓘ</span>
              </label>
              <input
                type="text"
                id="author"
                name="author"
                placeholder="e.g., F. Scott Fitzgerald"
                value={formData.author}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.author ? 'error' : ''}
                disabled={isSubmitting}
                list="author-suggestions"
              />
              {errors.author && <span className="field-error">{errors.author}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="genres">
              Genres <span className="required">*</span>
              <span className="tooltip" title="Select up to 5 genres that best describe your book">ⓘ</span>
            </label>
            <GenreSelector
              selectedGenres={formData.genres}
              onChange={(newGenres) => {
                setFormData(prev => ({ ...prev, genres: newGenres }));
                if (errors.genres && newGenres.length > 0) {
                  setErrors(prev => ({ ...prev, genres: '' }));
                }
              }}
              maxSelections={5}
            />
            {errors.genres && <span className="field-error">{errors.genres}</span>}
          </div>
        </div>


        {/* Condition Section */}
        <div className="form-card">
          <div className="card-header">
            <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3>Book Condition <span className="required">*</span></h3>
              <p>Select the condition that best describes your book</p>
            </div>
          </div>

          <div className="condition-grid">
            {conditionOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`condition-card ${formData.condition === option.value ? 'selected' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, condition: option.value }));
                  if (errors.condition) setErrors(prev => ({ ...prev, condition: '' }));
                }}
                disabled={isSubmitting}
              >
                <span className="condition-icon">{option.icon}</span>
                <span className="condition-label">{option.label}</span>
                <span className="condition-description">{option.description}</span>
                {formData.condition === option.value && (
                  <svg className="check-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          {errors.condition && <span className="field-error">{errors.condition}</span>}
        </div>

        {/* Images Section */}
        <div className="form-card">
          <div className="card-header">
            <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <h3>Book Photos <span className="required">*</span></h3>
              <p>Upload clear photos of your book (front and back recommended)</p>
            </div>
          </div>

          <div
            className={`dropzone ${isDragging ? 'dragging' : ''} ${errors.image ? 'error' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              disabled={isSubmitting}
            />
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="upload-text">
              <span className="upload-highlight">Click to upload</span> or drag and drop
            </p>
            <p className="upload-hint">PNG, JPG up to 10MB each</p>
          </div>

          {errors.image && <span className="field-error">{errors.image}</span>}

          {/* Image Previews */}
          {(images.length > 0 || formData.googleBooksImage) && (
            <div className="image-previews">
              {formData.googleBooksImage && (
                <div className="preview-item google-books">
                  <img 
                    src={formData.googleBooksImage} 
                    alt="Book cover from ISBN lookup"
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      console.error('❌ Image failed to load');
                      console.error('Image URL:', formData.googleBooksImage);
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      console.log('✅ Image loaded successfully');
                      e.target.style.display = 'block';
                    }}
                  />
                  <div className="preview-badge">
                    {formData.coverSource || 'OPEN LIBRARY'}
                  </div>
                </div>
              )}
              {images.map((img, index) => (
                <div key={img.id} className="preview-item">
                  <img src={img.preview} alt={`Preview ${index + 1}`} />
                  <div className="preview-actions">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index - 1)}
                        className="preview-btn"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        className="preview-btn"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="preview-btn delete"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className="preview-label">{index === 0 ? 'Front' : 'Back'}</div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Optional Information Section */}
        <div className="form-card">
          <div className="card-header">
            <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3>Additional Details</h3>
              <p>Optional information to help buyers</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the book's condition, any notes, or why you're trading it..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.description ? 'error' : ''}
              disabled={isSubmitting}
              rows="6"
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="publicationYear">Publication Year</label>
              <input
                type="number"
                id="publicationYear"
                name="publicationYear"
                placeholder="e.g., 2020"
                value={formData.publicationYear}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.publicationYear ? 'error' : ''}
                disabled={isSubmitting}
                min="1000"
                max={new Date().getFullYear() + 1}
              />
              {errors.publicationYear && <span className="field-error">{errors.publicationYear}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="publisher">Publisher</label>
              <input
                type="text"
                id="publisher"
                name="publisher"
                placeholder="e.g., Penguin Books"
                value={formData.publisher}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.publisher ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.publisher && <span className="field-error">{errors.publisher}</span>}
            </div>
          </div>

          {!showISBNLookup && (
            <div className="form-group">
              <label htmlFor="isbn-optional">ISBN (Optional)</label>
              <input
                type="text"
                id="isbn-optional"
                name="isbn"
                placeholder="Enter ISBN for better discoverability"
                value={formData.isbn}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.isbn ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.isbn && <span className="field-error">{errors.isbn}</span>}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Draft
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || submitInFlightRef.current}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Creating...
              </>
            ) : (
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Listing
              </>
            )}
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="keyboard-hints">
          <span>💡 Tip: Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save draft</span>
        </div>
      </form>
    </div>
  );
};

export default BookListingFormImproved;
