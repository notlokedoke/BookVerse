import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import CitySelector from '../components/common/CitySelector';
import './CompleteProfilePage.css';

const CompleteProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser, setToken } = useAuth();
  const toast = useToast();

  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const addTimer = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const urlToken = hashParams.get('token');
    const token = urlToken ? decodeURIComponent(urlToken) : localStorage.getItem('token');

    const verifyToken = async (t) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${t}` }
        });
        if (cancelled) return;
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error?.message || 'Your session has expired. Please sign in again.');
          addTimer(() => { localStorage.removeItem('token'); navigate('/login'); }, 3000);
          return;
        }
        setError('');
      } catch {
        if (cancelled) return;
        setError('Your session has expired. Please sign in again.');
        addTimer(() => { localStorage.removeItem('token'); navigate('/login'); }, 3000);
      }
    };

    if (token) {
      localStorage.setItem('token', token);
      verifyToken(token);
    } else {
      setError('No authentication token found. Redirecting to login...');
      addTimer(() => navigate('/login'), 2000);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [navigate]);

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
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const urlToken = hashParams.get('token');
      const token = urlToken ? decodeURIComponent(urlToken) : localStorage.getItem('token');

      if (!token) {
        setError('Your session has expired. Please sign in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (urlToken) {
        localStorage.setItem('token', token);
      }

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
        updateUser(response.data.data);
        setToken(token);
        toast.success('Profile completed successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 401 ||
        err.response?.data?.error?.code === 'INVALID_TOKEN' ||
        err.response?.data?.error?.code === 'NO_TOKEN') {
        const errorMsg = 'Your session has expired. Please sign in again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else {
        const errorMsg = err.response?.data?.error?.message || 'Failed to update profile';
        setError(errorMsg);
        toast.error(errorMsg);
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
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const urlToken = hashParams.get('token');
      const token = urlToken ? decodeURIComponent(urlToken) : localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found. Please sign in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (urlToken) {
        localStorage.setItem('token', token);
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
        updateUser(response.data.data);
        setToken(token);
        toast.info('Profile setup skipped. You can add your location later in settings.');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Skip profile error:', err);
      console.error('Error response:', err.response?.data);

      // Check if it's a token error
      if (err.response?.status === 401) {
        const errorMsg = 'Your session has expired. Please sign in again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else {
        const errorMsg = 'Failed to proceed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
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
              <CitySelector
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setError('');
                }}
                error={error}
                disabled={isSubmitting}
                required
                autoFocus
                placeholder="e.g., New York, NY"
              />
              <small className="field-hint">
                We use your city to connect you with local book traders in your area
              </small>
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
