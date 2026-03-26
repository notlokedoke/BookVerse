import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import {
  BookOpen,
  Search,
  Library,
  RefreshCw,
  Plus,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  Heart,
  MapPin
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications function
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch notifications on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Set up periodic polling every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    // Optimistic update for immediate UI feedback
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prevCount => Math.max(0, prevCount - 1));

    // Call API to persist the change
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: false } : notif
        )
      );
      setUnreadCount(prevCount => prevCount + 1);
      toast.error('Failed to mark notification as read');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    // Optimistic update for immediate UI feedback
    setNotifications(prevNotifications =>
      prevNotifications.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);

    // Call API to persist the change
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`${response.data.count} notification${response.data.count !== 1 ? 's' : ''} marked as read`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update on error
      fetchNotifications();
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Handle clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }

    // Optimistic update for immediate UI feedback
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    setNotifications([]);
    setUnreadCount(0);

    // Call API to persist the change
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('/api/notifications/clear-all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`${response.data.count} notification${response.data.count !== 1 ? 's' : ''} cleared`);
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error('Failed to clear notifications');
    }
  };

  // Handle notification dropdown open
  const handleNotificationOpen = () => {
    // Refresh notifications when dropdown opens
    fetchNotifications();
  };

  const isActive = (path) => location.pathname === path;

  const hideNavbar = ['/login', '/register'].includes(location.pathname);
  if (hideNavbar) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          <BookOpen size={24} strokeWidth={2.5} />
          <span className="logo-text">BookVerse</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/browse"
                className={`nav-link ${isActive('/browse') ? 'active' : ''}`}
              >
                <Search size={18} />
                <span>Browse</span>
              </Link>
              <Link
                to="/nearby"
                className={`nav-link ${isActive('/nearby') ? 'active' : ''}`}
              >
                <MapPin size={18} />
                <span>Local</span>
              </Link>
              <Link
                to="/my-books"
                className={`nav-link ${isActive('/my-books') ? 'active' : ''}`}
              >
                <Library size={18} />
                <span>My Books</span>
              </Link>
              <Link
                to="/wishlist"
                className={`nav-link ${isActive('/wishlist') ? 'active' : ''}`}
              >
                <Heart size={18} />
                <span>Wishlist</span>
              </Link>
              <Link
                to="/trades"
                className={`nav-link ${isActive('/trades') ? 'active' : ''}`}
              >
                <RefreshCw size={18} />
                <span>Trades</span>
              </Link>
            </>
          ) : (
            <Link
              to="/browse"
              className={`nav-link ${isActive('/browse') ? 'active' : ''}`}
            >
              <Search size={18} />
              <span>Browse</span>
            </Link>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/books/create" className="btn-add-book">
                <Plus size={18} />
                <span>Add Book</span>
              </Link>
              <NotificationBell
                unreadCount={unreadCount}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onClearAll={handleClearAll}
                onOpen={handleNotificationOpen}
              />
              <div className="user-menu">
                <button
                  className="user-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                >
                  <span className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user?.name}</p>
                      <p className="dropdown-email">{user?.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="dropdown-item">
                      <User size={16} />
                      Profile
                    </Link>
                    <Link to="/profile/settings" className="dropdown-item">
                      <Settings size={16} />
                      Settings
                    </Link>
                    <Link to="/safety" className="dropdown-item">
                      <Shield size={16} />
                      Safety Guidelines
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-signin">
                Sign In
              </Link>
              <Link to="/register" className="btn-getstarted">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-toggle"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-inner">
            {isAuthenticated ? (
              <>
                <div className="mobile-user-card">
                  <span className="mobile-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="mobile-name">{user?.name}</p>
                    <p className="mobile-email">{user?.email}</p>
                  </div>
                </div>

                <div className="mobile-nav-section">
                  <Link to="/dashboard" className="mobile-nav-link">
                    <LayoutDashboard size={20} />
                    Dashboard
                  </Link>
                  <Link to="/browse" className="mobile-nav-link">
                    <Search size={20} />
                    Browse
                  </Link>
                  <Link to="/nearby" className="mobile-nav-link">
                    <MapPin size={20} />
                    Local
                  </Link>
                  <Link to="/my-books" className="mobile-nav-link">
                    <Library size={20} />
                    My Books
                  </Link>
                  <Link to="/wishlist" className="mobile-nav-link">
                    <Heart size={20} />
                    Wishlist
                  </Link>
                  <Link to="/trades" className="mobile-nav-link">
                    <RefreshCw size={20} />
                    Trades
                  </Link>
                </div>

                <Link to="/books/create" className="mobile-add-btn">
                  <Plus size={20} />
                  Add Book
                </Link>

                <div className="mobile-footer">
                  <Link to="/profile" className="mobile-footer-link">
                    <User size={18} />
                    Profile
                  </Link>
                  <Link to="/profile/settings" className="mobile-footer-link">
                    <Settings size={18} />
                    Settings
                  </Link>
                  <Link to="/safety" className="mobile-footer-link">
                    <Shield size={18} />
                    Safety Guidelines
                  </Link>
                  <button onClick={handleLogout} className="mobile-footer-link logout">
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mobile-nav-section">
                  <Link to="/browse" className="mobile-nav-link">
                    <Search size={20} />
                    Browse
                  </Link>
                  <Link to="/safety" className="mobile-nav-link">
                    <Shield size={20} />
                    Safety Guidelines
                  </Link>
                </div>
                <div className="mobile-auth-btns">
                  <Link to="/login" className="mobile-signin">
                    Sign In
                  </Link>
                  <Link to="/register" className="mobile-getstarted">
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
