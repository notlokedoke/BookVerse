import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CitySelector from './common/CitySelector';
import './SignUp.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { name, email, password, confirmPassword, city } = formData;

  // Handle input changes
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Handle input changes
    if (name === 'city') {
      // City specific logic handled by component, but we still need to clear errors if needed
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Client-side field validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'city':
        if (!value.trim()) {
          error = 'City or region is required';
        } else if (value.trim().length < 2) {
          error = 'Please enter a valid city or region';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters long';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (formData.password !== value) {
          error = 'Passwords do not match';
        }
        break;
      default:
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate all fields
    const nameError = validateField('name', name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateField('email', email);
    if (emailError) newErrors.email = emailError;

    const cityError = validateField('city', city);
    if (cityError) newErrors.city = cityError;

    const passwordError = validateField('password', password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateField('confirmPassword', confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    // Terms agreement validation
    if (!agreed) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const apiUrl = import.meta.env.VITE_API_URL || '';

      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        name,
        email,
        password,
        city
      });

      if (response.data.success) {
        setSuccessMessage('Registration successful! Please check your email to verify your account.');
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          city: ''
        });
        setErrors({});
        setAgreed(false);

        // Redirect to login page after 4 seconds
        setTimeout(() => {
          navigate('/login');
        }, 4000);
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
    <div className="signup-page">
      {/* Header */}
      <div className="signup-header">
        <Link to="/" className="logo-container">
          <div className="logo-icon">📚</div>
          <span className="logo-text">BookVerse</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="signup-content">
        <div className="signup-container">
          {/* Left Side - Branding */}
          <div className="signup-left">
            <div className="brand-content">
              <h1 className="brand-title">BookVerse</h1>
              <p className="brand-subtitle">Trade books with fellow readers</p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="signup-right">
            <div className="form-container">
              <div className="form-header">
                <h2>Create your account</h2>
                <p>Join thousands of book traders</p>
              </div>

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

              <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Smith"
                    value={name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.name ? 'error' : ''}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.email ? 'error' : ''}
                    disabled={isSubmitting}
                    required
                  />
                  <small className="field-hint">We won't send you spam or share your email</small>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-group city-field-group">
                  <CitySelector
                    value={city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.city}
                    disabled={isSubmitting}
                    required
                    placeholder="e.g., New York, NY or Greater Boston Area"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.password ? 'error' : ''}
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <small className="field-hint">Min 8 characters, one uppercase, one number</small>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.confirmPassword ? 'error' : ''}
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span className="checkmark"></span>
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                  {errors.terms && <span className="field-error">{errors.terms}</span>}
                </div>

                <button
                  type="submit"
                  className="create-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              {/* Social Sign Up */}
              <div className="social-signup">
                <div className="divider">
                  <span>or sign up with</span>
                </div>

                <div className="social-buttons">
                  <button
                    className="social-btn google-btn"
                    type="button"
                    onClick={() => {
                      const apiUrl = import.meta.env.VITE_API_URL || '';
                      window.location.href = `${apiUrl}/api/auth/google`;
                    }}
                  >
                    <div className="social-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="signup-footer">
        <a href="/login">Already have an account? Sign In</a>
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/help">Help</a>
      </div>
    </div>
  );
};

export default SignUp;