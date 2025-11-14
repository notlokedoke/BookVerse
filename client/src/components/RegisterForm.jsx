import React, { useState } from 'react';
import axios from 'axios';
import './RegisterForm.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { name, email, password, city } = formData;

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

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // City validation
    if (!city.trim()) {
      newErrors.city = 'City is required';
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/auth/register`, formData);

      if (response.data.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          city: ''
        });
        setErrors({});
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        
        if (errorData.error) {
          // Handle specific error codes
          if (errorData.error.code === 'EMAIL_EXISTS') {
            setErrors({ email: 'An account with this email already exists' });
          } else if (errorData.error.code === 'VALIDATION_ERROR') {
            // Handle validation errors from server
            if (errorData.error.details && Array.isArray(errorData.error.details)) {
              const serverErrors = {};
              errorData.error.details.forEach(err => {
                if (err.path) {
                  serverErrors[err.path] = err.msg;
                }
              });
              setErrors(serverErrors);
            } else {
              setErrors({ general: errorData.error.message });
            }
          } else {
            setErrors({ general: errorData.error.message || 'Registration failed. Please try again.' });
          }
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
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
    <div className="register-form-container">
      <div className="register-form-card">
        <h2>Create Your Account</h2>
        <p className="register-subtitle">Join BookVerse to start trading books</p>

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
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="At least 8 characters"
              disabled={isSubmitting}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={city}
              onChange={handleChange}
              className={errors.city ? 'error' : ''}
              placeholder="Enter your city"
              disabled={isSubmitting}
            />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
