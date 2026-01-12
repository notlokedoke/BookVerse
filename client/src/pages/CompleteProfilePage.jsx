import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './CompleteProfilePage.css';

const CompleteProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get token from URL and decode if needed
    let token = searchParams.get('token');
    
    console.log('=== CompleteProfilePage useEffect ===');
    console.log('Current URL:', window.location.href);
    console.log('Token in URL params:', token ? 'YES' : 'NO');
    
    if (token) {
      // Token might be URL encoded, try to decode it
      try {
        const decoded = decodeURIComponent(token);
        if (decoded !== token) {
          console.log('Token was URL encoded, decoded it');
          token = decoded;
        }
      } catch (e) {
        console.log('Token does not need decoding');
      }
      
      console.log('Token length:', token.length);
      console.log('Token first 30 chars:', token.substring(0, 30));
      console.log('Token last 30 chars:', token.substring(token.length - 30));
      
      console.log('Storing token in localStorage...');
      localStorage.setItem('token', token);
      console.log('Token stored. Verifying localStorage:', !!localStorage.getItem('token'));
      
      // Verify token is valid by fetching user data
      const verifyToken = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          console.log('Verifying token with API:', apiUrl);
          
          const response = await fetch(`${apiUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Token verification response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Token verification failed:', errorData);
            setError(errorData.error?.message || 'Your session has expired. Please sign in again.');
            setTimeout(() => {
              localStorage.removeItem('token');
              navigate('/login');
            }, 3000);
            return;
          }
          
          const data = await response.json();
          console.log('Token verified successfully for user:', data.data?.email);
          setError('');
        } catch (error) {
          console.error('Token verification error:', error);
          setError('Your session has expired. Please sign in again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            navigate('/login');
          }, 3000);
        }
      };
      
      verifyToken();
    } else {
      console.log('No token in URL');
      const storedToken = localStorage.getItem('token');
      console.log('Checking localStorage for token:', storedToken ? 'FOUND' : 'NOT FOUND');
      
      if (!storedToken) {
        console.log('No token found anywhere, redirecting to login in 2 seconds...');
        setError('No authentication token found. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        console.log('Found stored token, verifying...');
        // If we have a stored token, verify it
        const verifyStoredToken = async () => {
          try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });
            
            if (!response.ok) {
              console.error('Stored token is invalid');
              localStorage.removeItem('token');
              navigate('/login');
              return;
            }
            
            console.log('Stored token is valid');
            setError('');
          } catch (error) {
            console.error('Error verifying stored token:', error);
            localStorage.removeItem('token');
            navigate('/login');
          }
        };
        
        verifyStoredToken();
      }
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!city.trim()) {
      setError('City is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      console.log('Submitting profile with token:', token ? 'Token exists' : 'No token');

      const response = await axios.put(
        `${apiUrl}/api/auth/profile`,
        { city: city.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      console.error('Error response:', err.response?.data);
      
      // Check if it's a token error
      if (err.response?.data?.error?.code === 'INVALID_TOKEN' || 
          err.response?.data?.error?.code === 'NO_TOKEN') {
        setError('Your session has expired. Please sign in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      console.log('Skip button clicked, token exists:', !!token);

      if (!token) {
        setError('No authentication token found. Please sign in again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Fetch user data with the token
      const response = await axios.get(
        `${apiUrl}/api/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Skip profile - User data fetched:', response.data);

      if (response.data.success) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Skip profile error:', err);
      console.error('Error response:', err.response?.data);
      
      // Check if it's a token error
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to proceed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="complete-profile-page">
      <div className="complete-profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="welcome-icon">👋</div>
            <h1>Welcome to BookVerse!</h1>
            <p>Just one more step to complete your profile</p>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="city">Your City / Region</label>
              <input
                type="text"
                id="city"
                placeholder="e.g., New York, NY"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setError('');
                }}
                className={error ? 'error' : ''}
                disabled={isSubmitting}
                autoFocus
              />
              <small className="field-hint">
                We use your location to connect you with nearby book traders
              </small>
              {error && <span className="field-error">{error}</span>}
            </div>

            <button 
              type="submit" 
              className="complete-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'}
            </button>

            <button 
              type="button" 
              className="skip-btn" 
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip for now
            </button>

            <p className="skip-note">
              You can add your location later from profile settings
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
