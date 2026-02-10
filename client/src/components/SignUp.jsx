import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { worldCities, cityAliases } from '../data/worldCities';
import './SignUp.css';

const SignUp = () => {
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
  
  // City field enhancements
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const { name, email, password, confirmPassword, city } = formData;

  // Global cities database for autocomplete (500+ cities, completely free!)
  const globalCities = worldCities;

  // Enhanced city filtering with better search algorithm and aliases
  const filterCities = (input) => {
    if (!input || input.length < 2) return [];
    
    const searchTerm = input.toLowerCase().trim();
    
    // Check if input matches any alias
    const aliasMatch = cityAliases[input.toUpperCase()];
    if (aliasMatch) {
      return [aliasMatch];
    }
    
    // Priority scoring: exact matches first, then starts with, then contains
    const scoredCities = globalCities.map(city => {
      const cityLower = city.toLowerCase();
      let score = 0;
      
      if (cityLower === searchTerm) score = 100; // Exact match
      else if (cityLower.startsWith(searchTerm)) score = 90; // Starts with
      else if (cityLower.includes(searchTerm)) score = 50; // Contains
      else {
        // Check if any word in the city starts with the search term
        const words = cityLower.split(/[\s,]+/);
        if (words.some(word => word.startsWith(searchTerm))) score = 70;
        
        // Check for partial matches in country/region names
        if (words.some(word => word.includes(searchTerm) && word.length > 3)) score = 30;
      }
      
      // Boost score for popular cities
      if (cityLower.includes('new york') || cityLower.includes('london') || 
          cityLower.includes('tokyo') || cityLower.includes('paris') ||
          cityLower.includes('sydney') || cityLower.includes('toronto')) {
        score += 10;
      }
      
      return { city, score };
    });
    
    return scoredCities
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Increased to 10 for better coverage
      .map(item => item.city);
  };

  // Phase 2: Free API integration (no registration required)
  const searchCitiesAPI = async (input) => {
    try {
      // Option 1: Use free Nominatim service (no API key required)
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/cities/search-free?q=${encodeURIComponent(input)}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.cities || [];
      }
    } catch (error) {
      console.log('Free API search unavailable, using local database');
    }
    
    // Fallback: Try direct Nominatim call (rate limited but free)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(input)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `featuretype=city`,
        {
          headers: {
            'User-Agent': 'BookVerse-App/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.map(item => {
          const address = item.address || {};
          const city = address.city || address.town || address.village || item.display_name.split(',')[0];
          const country = address.country;
          return country ? `${city}, ${country}` : city;
        }).filter(city => city && city.length > 0).slice(0, 5);
      }
    } catch (error) {
      console.log('Direct API call failed, using local database only');
    }
    
    return [];
  };

  // Hybrid approach: Local database + API fallback
  const getCitySuggestions = async (input) => {
    if (!input || input.length < 2) return [];
    
    // 1. First, search local database for fast results
    const localResults = filterCities(input);
    
    // 2. If we have good local results, use them
    if (localResults.length >= 5) {
      return localResults;
    }
    
    // 3. If insufficient local results, try API for more options
    try {
      const apiResults = await searchCitiesAPI(input);
      
      // Combine and deduplicate results
      const combinedResults = [...localResults];
      apiResults.forEach(city => {
        if (!combinedResults.some(existing => 
          existing.toLowerCase() === city.toLowerCase()
        )) {
          combinedResults.push(city);
        }
      });
      
      return combinedResults.slice(0, 8);
    } catch (error) {
      console.error('Error fetching additional cities:', error);
      return localResults;
    }
  };

  // Get user's location using geolocation API
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setErrors({ ...errors, city: 'Geolocation is not supported by this browser' });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use a reverse geocoding service (you can replace with your preferred service)
          const { latitude, longitude } = position.coords;
          
          // For demo purposes, we'll use a simple approximation
          // In production, you'd use a proper geocoding service like Google Maps API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const detectedCity = data.city && data.principalSubdivisionCode 
              ? `${data.city}, ${data.principalSubdivisionCode}`
              : data.city || data.locality || 'Unknown Location';
            
            setFormData({
              ...formData,
              city: detectedCity
            });
            
            // Clear any existing city errors
            if (errors.city) {
              setErrors({
                ...errors,
                city: ''
              });
            }
          } else {
            throw new Error('Unable to detect location');
          }
        } catch (error) {
          setErrors({ ...errors, city: 'Unable to detect your location. Please enter manually.' });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Unable to access your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or enter your city manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        setErrors({ ...errors, city: errorMessage });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle input changes
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Handle city autocomplete with hybrid search
    if (name === 'city') {
      if (value.length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await getCitySuggestions(value);
          setCitySuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error('Error getting city suggestions:', error);
          // Fallback to local search only
          const localSuggestions = filterCities(value);
          setCitySuggestions(localSuggestions);
          setShowSuggestions(localSuggestions.length > 0);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
        setIsLoadingSuggestions(false);
      }
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle city suggestion selection
  const handleCitySelect = (selectedCity) => {
    setFormData({
      ...formData,
      city: selectedCity
    });
    setShowSuggestions(false);
    setCitySuggestions([]);
    
    // Clear city error if exists
    if (errors.city) {
      setErrors({
        ...errors,
        city: ''
      });
    }
  };

  // Hide suggestions when clicking outside
  const handleCityBlur = () => {
    // Delay hiding to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
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

    // City validation
    if (!city.trim()) {
      newErrors.city = 'City or region is required';
    } else if (city.trim().length < 2) {
      newErrors.city = 'Please enter a valid city or region';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!agreed) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
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
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        name,
        email,
        password,
        city
      });

      if (response.data.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
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
                    className={errors.email ? 'error' : ''}
                    disabled={isSubmitting}
                    required
                  />
                  <small className="field-hint">We won't send you spam or share your email</small>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-group city-field-group">
                  <label htmlFor="city">City / Region</label>
                  <div className="city-input-container">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="e.g., New York, NY or Greater Boston Area"
                      value={city}
                      onChange={handleChange}
                      onBlur={handleCityBlur}
                      onFocus={async () => {
                        if (city.length >= 2) {
                          setIsLoadingSuggestions(true);
                          try {
                            const suggestions = await getCitySuggestions(city);
                            setCitySuggestions(suggestions);
                            setShowSuggestions(suggestions.length > 0);
                          } catch (error) {
                            const localSuggestions = filterCities(city);
                            setCitySuggestions(localSuggestions);
                            setShowSuggestions(localSuggestions.length > 0);
                          } finally {
                            setIsLoadingSuggestions(false);
                          }
                        }
                      }}
                      className={errors.city ? 'error' : ''}
                      disabled={isSubmitting}
                      required
                      autoComplete="address-level2"
                    />
                    <button
                      type="button"
                      className="location-btn"
                      onClick={getCurrentLocation}
                      disabled={isSubmitting || isGettingLocation}
                      title="Use my current location"
                    >
                      {isGettingLocation ? (
                        <span className="location-loading">📍</span>
                      ) : (
                        <span className="location-icon">📍</span>
                      )}
                    </button>
                    
                    {(showSuggestions && citySuggestions.length > 0) || isLoadingSuggestions ? (
                      <div className="city-suggestions">
                        {isLoadingSuggestions ? (
                          <div className="city-suggestion loading">
                            <span className="loading-spinner">🔍</span>
                            Searching cities worldwide...
                          </div>
                        ) : (
                          citySuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="city-suggestion"
                              onClick={() => handleCitySelect(suggestion)}
                            >
                              {suggestion}
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                  <small className="field-hint privacy-note">
                    💡 We use your location to connect you with nearby book traders. 
                    You can use broader terms like "Greater [City] Area" for privacy.
                  </small>
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handleChange}
                    className={errors.password ? 'error' : ''}
                    disabled={isSubmitting}
                    required
                  />
                  <small className="field-hint">Min 8 characters, one uppercase, one number</small>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    disabled={isSubmitting}
                    required
                  />
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
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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