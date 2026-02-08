import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PrivacyToggle from '../components/PrivacyToggle';
import CitySelector from '../components/common/CitySelector';
import { User, Shield, Lock, Bell, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import './ProfileSettingsPage.css';

const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    bio: '',
    privacySettings: {
      showCity: true,
      showEmail: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailTradeProposals: true,
    emailMessages: true,
    emailCompletedTrades: true,
    emailWishlistMatches: true,
    pushNotifications: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      const initialData = {
        name: user.name || '',
        city: user.city || '',
        bio: user.bio || '',
        privacySettings: {
          showCity: user.privacySettings?.showCity !== false,
          showEmail: user.privacySettings?.showEmail || false
        }
      };
      setFormData(initialData);
      setHasUnsavedChanges(false);
      
      // Load notification settings
      if (user.notificationSettings) {
        setNotificationSettings(user.notificationSettings);
      }
    }
  }, [user]);

  // Track unsaved changes
  useEffect(() => {
    if (!user) return;
    
    const hasChanges = 
      formData.name !== (user.name || '') ||
      formData.city !== (user.city || '') ||
      formData.bio !== (user.bio || '') ||
      formData.privacySettings.showCity !== (user.privacySettings?.showCity !== false) ||
      formData.privacySettings.showEmail !== (user.privacySettings?.showEmail || false);
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, user]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && (activeSection === 'profile' || activeSection === 'privacy')) {
          handleSubmit(e);
        }
      }
      // Escape to cancel/close modal
      if (e.key === 'Escape') {
        if (showPasswordModal) {
          setShowPasswordModal(false);
        } else if (hasUnsavedChanges) {
          handleDiscardChanges();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, activeSection, showPasswordModal]);

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          error = 'Name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (value.length > 100) {
          error = 'Name must be less than 100 characters';
        }
        break;
      
      case 'city':
        if (!value || value.trim() === '') {
          error = 'City is required';
        }
        break;
      
      case 'bio':
        if (value && value.length > 500) {
          error = 'Bio must be less than 500 characters';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handlePrivacyToggle = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [setting]: value
      }
    }));
  };

  const handleDiscardChanges = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        city: user.city || '',
        bio: user.bio || '',
        privacySettings: {
          showCity: user.privacySettings?.showCity !== false,
          showEmail: user.privacySettings?.showEmail || false
        }
      });
      setHasUnsavedChanges(false);
      toast.info('Changes discarded');
    }
  };

  const validatePasswordField = (name, value, allData) => {
    let error = '';
    
    switch (name) {
      case 'currentPassword':
        if (!value || value.trim() === '') {
          error = 'Current password is required';
        }
        break;
      
      case 'newPassword':
        if (!value || value.trim() === '') {
          error = 'New password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value === allData.currentPassword) {
          error = 'New password must be different from current password';
        }
        break;
      
      case 'confirmPassword':
        if (!value || value.trim() === '') {
          error = 'Please confirm your password';
        } else if (value !== allData.newPassword) {
          error = 'Passwords do not match';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordBlur = (e) => {
    const { name, value } = e.target;
    const error = validatePasswordField(name, value, passwordData);
    
    setPasswordErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { strength, label: 'Fair', color: '#f59e0b' };
    if (strength <= 4) return { strength, label: 'Good', color: '#3b82f6' };
    return { strength, label: 'Strong', color: '#2ECC71' };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    Object.keys(passwordData).forEach(field => {
      const error = validatePasswordField(field, passwordData[field], passwordData);
      if (error) newErrors[field] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        toast.error(data.error?.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error('An error occurred while changing password');
      console.error('Password change error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      if (field !== 'privacySettings') {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
        toast.success('Profile updated successfully!');
        updateUser(data.data);
        // Update formData with the saved data to reflect in preview
        setFormData({
          name: data.data.name || '',
          city: data.data.city || '',
          bio: data.data.bio || '',
          privacySettings: {
            showCity: data.data.privacySettings?.showCity !== false,
            showEmail: data.data.privacySettings?.showEmail || false
          }
        });
        setHasUnsavedChanges(false);
      } else {
        toast.error(data.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('An error occurred while updating your profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { 
      id: 'profile', 
      label: 'Profile Information', 
      icon: User,
      badge: (!user?.name || !user?.city || !user?.bio) ? 'incomplete' : null
    },
    { 
      id: 'privacy', 
      label: 'Privacy Settings', 
      icon: Shield 
    },
    { 
      id: 'security', 
      label: 'Account Security', 
      icon: Lock,
      badge: (!user?.lastPasswordChange) ? 'warning' : null
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell 
    }
  ];

  const handleNotificationToggle = (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notificationSettings })
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
        toast.success('Notification settings updated!');
        updateUser(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to update settings');
      }
    } catch (err) {
      toast.error('An error occurred while updating settings');
      console.error('Notification settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateDeleteConfirmation = (value) => {
    if (!value || value.trim() === '') {
      return 'Confirmation is required';
    } else if (value !== 'DELETE') {
      return 'You must type DELETE exactly';
    }
    return '';
  };

  const handleDeleteConfirmationChange = (e) => {
    const value = e.target.value;
    setDeleteConfirmation(value);
    
    // Clear error when user starts typing
    if (deleteError) {
      setDeleteError('');
    }
  };

  const handleDeleteConfirmationBlur = (e) => {
    const value = e.target.value;
    const error = validateDeleteConfirmation(value);
    setDeleteError(error);
  };

  const handleDeleteAccount = async () => {
    const error = validateDeleteConfirmation(deleteConfirmation);
    if (error) {
      setDeleteError(error);
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account deleted successfully');
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        toast.error(data.error?.message || 'Failed to delete account');
      }
    } catch (err) {
      toast.error('An error occurred while deleting account');
      console.error('Delete account error:', err);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const lastPasswordChange = user?.lastPasswordChange 
    ? new Date(user.lastPasswordChange).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Page Header */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and privacy</p>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="unsaved-changes-banner">
            <div className="banner-content">
              <AlertTriangle size={20} />
              <span>You have unsaved changes</span>
            </div>
            <button 
              type="button" 
              className="btn-discard"
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </button>
          </div>
        )}

        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            <nav className="settings-nav">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={20} />
                    <span>{section.label}</span>
                    {section.badge === 'incomplete' && (
                      <span className="nav-badge incomplete">!</span>
                    )}
                    {section.badge === 'warning' && (
                      <span className="nav-badge warning">⚠</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="settings-content">
            <form onSubmit={handleSubmit}>
              {/* Profile Information Section */}
              {activeSection === 'profile' && (
                <div className="settings-section">
                  <div className="section-header">
                    <User size={24} />
                    <div>
                      <h2>Profile Information</h2>
                      <p>Update your personal details and bio</p>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        placeholder="Enter your name"
                      />
                      {errors.name && (
                        <span className="input-error">{errors.name}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="disabled-input"
                      />
                      <span className="input-hint">Email cannot be changed</span>
                    </div>

                    <div className="form-group">
                      <CitySelector
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your city"
                        error={errors.city}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="bio">Bio (Optional)</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        rows="4"
                        placeholder="Tell others about yourself and your reading interests..."
                        maxLength="500"
                      />
                      {errors.bio && (
                        <span className="input-error">{errors.bio}</span>
                      )}
                      <div className="bio-footer">
                        <span className="input-hint">Share your favorite genres, authors, or what you're looking for</span>
                        <span className={`char-counter ${(formData.bio?.length || 0) > 450 ? 'warning' : ''}`}>
                          {formData.bio?.length || 0}/500
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Preview */}
                  <div className="profile-preview-card">
                    <div className="preview-header">
                      <h3>Profile Preview</h3>
                      <p>How others see your profile</p>
                    </div>
                    <div className="preview-content">
                      <div className="preview-avatar">
                        {formData.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="preview-info">
                        <h4>{formData.name || 'Your Name'}</h4>
                        {formData.city && formData.privacySettings.showCity && (
                          <p className="preview-city">📍 {formData.city}</p>
                        )}
                        {formData.bio ? (
                          <p className="preview-bio">{formData.bio}</p>
                        ) : (
                          <p className="preview-bio empty">No bio added yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings Section */}
              {activeSection === 'privacy' && (
                <div className="settings-section">
                  <div className="section-header">
                    <Shield size={24} />
                    <div>
                      <h2>Privacy Settings</h2>
                      <p>Control what information is visible to others</p>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="privacy-item">
                      <div className="privacy-info">
                        <h3>Show city on profile</h3>
                        <p>When enabled, other users can see your city information</p>
                        <div className="privacy-example">
                          {formData.privacySettings.showCity ? (
                            <span className="example-visible">✓ Visible: "📍 {formData.city || 'Your City'}"</span>
                          ) : (
                            <span className="example-hidden">✗ Hidden: City not shown</span>
                          )}
                        </div>
                        <a href="/privacy-policy" className="privacy-link" target="_blank" rel="noopener noreferrer">
                          Learn more about privacy
                        </a>
                      </div>
                      <PrivacyToggle
                        showCity={formData.privacySettings.showCity}
                        onChange={(value) => handlePrivacyToggle('showCity', value)}
                        label=""
                        description=""
                      />
                    </div>

                    <div className="privacy-item">
                      <div className="privacy-info">
                        <h3>Show email to trade partners</h3>
                        <p>Allow users you're trading with to see your email address</p>
                        <div className="privacy-example">
                          {formData.privacySettings.showEmail ? (
                            <span className="example-visible">✓ Visible to active trade partners</span>
                          ) : (
                            <span className="example-hidden">✗ Email remains private</span>
                          )}
                        </div>
                      </div>
                      <PrivacyToggle
                        showCity={formData.privacySettings.showEmail}
                        onChange={(value) => handlePrivacyToggle('showEmail', value)}
                        label=""
                        description=""
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Account Security Section */}
              {activeSection === 'security' && (
                <div className="settings-section">
                  <div className="section-header">
                    <Lock size={24} />
                    <div>
                      <h2>Account Security</h2>
                      <p>Manage your password and security preferences</p>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="security-item">
                      <div className="security-info">
                        <h3>Password</h3>
                        <p>Last changed: {lastPasswordChange}</p>
                        {lastPasswordChange === 'Never' && (
                          <span className="security-warning">
                            <AlertTriangle size={14} />
                            Consider changing your password
                          </span>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="info-banner">
                      <Lock size={16} />
                      <span>Two-factor authentication coming soon</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="settings-section">
                  <div className="section-header">
                    <Bell size={24} />
                    <div>
                      <h2>Notification Preferences</h2>
                      <p>Choose how you want to be notified about activity</p>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="notification-group">
                      <h3 className="group-title">Email Notifications</h3>
                      
                      <div className="privacy-item">
                        <div className="privacy-info">
                          <h3>Trade Proposals</h3>
                          <p>Get notified when someone proposes a trade with you</p>
                        </div>
                        <PrivacyToggle
                          showCity={notificationSettings.emailTradeProposals}
                          onChange={(value) => handleNotificationToggle('emailTradeProposals', value)}
                          label=""
                          description=""
                        />
                      </div>

                      <div className="privacy-item">
                        <div className="privacy-info">
                          <h3>New Messages</h3>
                          <p>Receive email alerts for new chat messages</p>
                        </div>
                        <PrivacyToggle
                          showCity={notificationSettings.emailMessages}
                          onChange={(value) => handleNotificationToggle('emailMessages', value)}
                          label=""
                          description=""
                        />
                      </div>

                      <div className="privacy-item">
                        <div className="privacy-info">
                          <h3>Completed Trades</h3>
                          <p>Get notified when a trade is marked as completed</p>
                        </div>
                        <PrivacyToggle
                          showCity={notificationSettings.emailCompletedTrades}
                          onChange={(value) => handleNotificationToggle('emailCompletedTrades', value)}
                          label=""
                          description=""
                        />
                      </div>

                      <div className="privacy-item">
                        <div className="privacy-info">
                          <h3>Wishlist Matches</h3>
                          <p>Alert me when books on my wishlist become available</p>
                        </div>
                        <PrivacyToggle
                          showCity={notificationSettings.emailWishlistMatches}
                          onChange={(value) => handleNotificationToggle('emailWishlistMatches', value)}
                          label=""
                          description=""
                        />
                      </div>
                    </div>

                    <div className="notification-group">
                      <h3 className="group-title">Push Notifications</h3>
                      
                      <div className="privacy-item">
                        <div className="privacy-info">
                          <h3>Browser Notifications</h3>
                          <p>Receive real-time notifications in your browser</p>
                        </div>
                        <PrivacyToggle
                          showCity={notificationSettings.pushNotifications}
                          onChange={(value) => handleNotificationToggle('pushNotifications', value)}
                          label=""
                          description=""
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-actions">
                    <button
                      type="button"
                      className="btn-save"
                      onClick={handleSaveNotifications}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {(activeSection === 'profile' || activeSection === 'privacy') && (
                <div className="settings-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                    {showSuccessAnimation && (
                      <span className="success-checkmark">✓</span>
                    )}
                  </button>
                </div>
              )}
            </form>

            {/* Success Animation Overlay */}
            {showSuccessAnimation && (
              <div className="success-overlay">
                <div className="success-circle">
                  <svg className="checkmark" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
              <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h2>Delete Account</h2>
                      <p>This action cannot be undone</p>
                    </div>
                    <button 
                      className="modal-close"
                      onClick={() => setShowDeleteModal(false)}
                      type="button"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="delete-warning">
                      <AlertTriangle size={48} />
                      <h3>You are about to delete:</h3>
                      <ul>
                        <li>Your profile and personal information</li>
                        <li>All your book listings</li>
                        <li>Trade history and messages</li>
                        <li>Ratings and reviews</li>
                        <li>Wishlist items</li>
                      </ul>
                    </div>

                    <div className="form-group">
                      <label htmlFor="deleteConfirm">
                        Type <strong>DELETE</strong> to confirm
                      </label>
                      <input
                        type="text"
                        id="deleteConfirm"
                        value={deleteConfirmation}
                        onChange={handleDeleteConfirmationChange}
                        onBlur={handleDeleteConfirmationBlur}
                        placeholder="Type DELETE"
                        autoComplete="off"
                      />
                      {deleteError && (
                        <span className="input-error">{deleteError}</span>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={loading || deleteConfirmation !== 'DELETE'}
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h2>Change Password</h2>
                      <p>Enter your current password and choose a new one</p>
                    </div>
                    <button 
                      className="modal-close"
                      onClick={() => setShowPasswordModal(false)}
                      type="button"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handlePasswordSubmit}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            onBlur={handlePasswordBlur}
                            required
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <span className="input-error">{passwordErrors.currentPassword}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            id="newPassword"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            onBlur={handlePasswordBlur}
                            required
                            placeholder="Enter new password"
                            minLength="8"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <span className="input-error">{passwordErrors.newPassword}</span>
                        )}
                        {passwordData.newPassword && (
                          <div className="password-strength">
                            <div className="strength-bar">
                              <div 
                                className="strength-fill"
                                style={{ 
                                  width: `${(passwordStrength.strength / 5) * 100}%`,
                                  backgroundColor: passwordStrength.color
                                }}
                              />
                            </div>
                            <span 
                              className="strength-label"
                              style={{ color: passwordStrength.color }}
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                        )}
                        <span className="input-hint">Must be at least 8 characters long</span>
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            onBlur={handlePasswordBlur}
                            required
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <span className="input-error">{passwordErrors.confirmPassword}</span>
                        )}
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowPasswordModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-save"
                        disabled={passwordLoading || passwordData.newPassword !== passwordData.confirmPassword}
                      >
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeSection === 'security' && (
              <div className="danger-zone">
                <div className="section-header danger">
                  <AlertTriangle size={24} />
                  <div>
                    <h2>Danger Zone</h2>
                    <p>Irreversible actions</p>
                  </div>
                </div>

                <div className="glass-card danger-card">
                  <div className="danger-item">
                    <div>
                      <h3>Delete Account</h3>
                      <p>Permanently delete your account and all associated data</p>
                    </div>
                    <button 
                      type="button" 
                      className="btn-danger"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="keyboard-shortcuts">
              <span className="shortcut-hint">
                <kbd>⌘/Ctrl</kbd> + <kbd>S</kbd> to save
              </span>
              <span className="shortcut-hint">
                <kbd>Esc</kbd> to cancel
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;