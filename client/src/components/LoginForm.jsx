import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { email, password } = formData;

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

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
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
      const result = await login(email, password);

      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');
        // Clear form
        setFormData({
          email: '',
          password: ''
        });
        setErrors({});
        
        // Redirect to home page after 1 second
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    // For now, just show an alert since we don't have a forgot password page yet
    alert('Forgot password functionality will be implemented soon. Please contact support for now.');
  };

  return (
    <div className="login-container">
      {/* Brand Section */}
      <section className="brand-section">
        <h1>BookVerse</h1>
        <p>Trade books with fellow readers</p>
      </section>

      {/* Form Section */}
      <section className="form-section">
        <div className="form-section-inner">
          <div className="form-intro">
            <h2>Welcome back</h2>
            <p>Sign in to continue trading</p>
          </div>

          <div className="form-container">
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
                {errors.email && <span className="field-error">{errors.email}</span>}
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
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
                <button 
                  type="submit" 
                  className="login-btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Social Sign In Section */}
      <section className="social-section">
        <div className="social-section-inner">
          <div className="social-intro">
            <h2>or continue with</h2>
          </div>

          <div className="social-buttons">
            <button className="social-btn google-btn" type="button">
              <div className="social-icon">
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span>Continue with Google</span>
            </button>
            
            <button className="social-btn apple-btn" type="button">
              <div className="social-icon">
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path fill="#000" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </div>
              <span>Continue with Apple</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sign Up Link Section */}
      <section className="signup-link-section">
        <p>Don't have an account? <a href="/register">Sign Up</a></p>
      </section>

      {/* Footer */}
      <footer className="login-footer">
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/help">Help</a>
      </footer>
    </div>
  );
};

export default LoginForm;