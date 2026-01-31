import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PrivacyToggle from '../components/PrivacyToggle';
import CitySelector from '../components/common/CitySelector';
import { User, Shield, Lock, Bell, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
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
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        toast.success('Profile updated successfully!');
        updateUser(data.data);
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
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'privacy', label: 'Privacy Settings', icon: Shield },
    { id: 'security', label: 'Account Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Page Header */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and privacy</p>
        </div>

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
                        required
                        placeholder="Enter your name"
                      />
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
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="bio">Bio (Optional)</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Tell others about yourself and your reading interests..."
                        maxLength="500"
                      />
                      <span className="input-hint">{formData.bio.length}/500 characters</span>
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
                        <p>Last changed: Never</p>
                      </div>
                      <button type="button" className="btn-secondary">
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
                      <p>Choose how you want to be notified</p>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="info-banner">
                      <Bell size={16} />
                      <span>Notification preferences coming soon</span>
                    </div>
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
                  </button>
                </div>
              )}
            </form>

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
                    <button type="button" className="btn-danger">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;