import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge } from './ui';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notificationCount] = useState(3); // Dynamic notification count
  const [searchQuery, setSearchQuery] = useState('');

  // Sync search query with URL param when on browse page
  useEffect(() => {
    if (location.pathname === '/browse') {
      setSearchQuery(searchParams.get('title') || '');
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, searchParams]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (location.pathname === '/browse') {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('title', searchQuery.trim());
      setSearchParams(newParams);
    } else {
      navigate(`/browse?title=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path) => location.pathname === path;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Check if current page should hide navbar
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  if (hideNavbar) return null;

  // Dynamic navigation links based on user role and page context
  const authNavLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', show: true },
    { path: '/browse', label: 'Browse', icon: '🔍', show: true },
    { path: '/my-books', label: 'My Books', icon: '📚', show: true },
    { path: '/trades', label: 'Trades', icon: '🔄', badge: 2, show: true },
    { path: '/safety', label: 'Safety', icon: '🛡️', show: true },
  ];

  const publicNavLinks = [
    { path: '/browse', label: 'Browse Books', show: true },
    { path: '/about', label: 'About', show: true },
    { path: '/how-it-works', label: 'How It Works', show: true },
  ];

  // Get page title dynamically
  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/browse': 'Browse Books',
      '/my-books': 'My Books',
      '/trades': 'Trades',
      '/profile': 'Profile',
      '/profile/settings': 'Settings',
      '/wishlist/create': 'Add to Wishlist',
      '/books/create': 'Add Book',
    };
    return titles[location.pathname] || '';
  };

  const pageTitle = getPageTitle();

  return (
    <nav
      className={`
        bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 border-b border-neutral-100
        ${isScrolled ? 'shadow-lg' : 'shadow-sm'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4 lg:gap-8">
          {/* Logo */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <span className="text-2xl">📚</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent hidden sm:inline">
              BookVerse
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <form onSubmit={handleSearch} className="w-full relative group">
              <input
                type="text"
                placeholder="Search books by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all outline-none text-sm"
              />
              <svg
                className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>

          {/* Page Title - Shows on mobile only if not browsing (to save space) */}
          {pageTitle && location.pathname !== '/browse' && (
            <div className="md:hidden flex-1 text-center">
              <h1 className="text-lg font-semibold text-neutral-800">{pageTitle}</h1>
            </div>
          )}

          {/* Mobile Search Icon - Shows on mobile only if browsing */}
          <div className="md:hidden flex-1 flex justify-end">
            {/* Simple spacer or mobile search toggle could go here */}
          </div>


          {/* Desktop Navigation */}
          {isAuthenticated ? (
            // Authenticated User Navigation
            <>
              <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                {authNavLinks.filter(link => link.show).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm lg:text-base
                      ${isActive(link.path)
                        ? 'bg-primary-50 text-primary-500'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-600'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span className="hidden lg:inline">{link.icon}</span>
                      <span>{link.label}</span>
                      {link.badge > 0 && (
                        <Badge variant="error" className="ml-1 px-1.5 py-0.5 text-xs">
                          {link.badge}
                        </Badge>
                      )}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Desktop Right Side - Authenticated */}
              <div className="hidden md:flex items-center gap-3 lg:gap-4 flex-shrink-0">
                {/* Quick Actions */}
                <Link to="/books/create">
                  <Button variant="accent" size="sm" className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden lg:inline">Add Book</span>
                  </Button>
                </Link>

                {/* Notifications */}
                <button className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-primary-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-neutral-50 transition-all border border-transparent hover:border-neutral-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-neutral-100 py-2 animate-slide-down origin-top-right ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                        <p className="text-sm font-semibold text-neutral-900">{user?.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </Link>

                        <Link
                          to="/profile/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>

                        <Link
                          to="/wishlist/create"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Wishlist
                        </Link>
                      </div>

                      <div className="border-t border-neutral-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Public User Navigation
            <>
              <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
                {/* Re-use Search here if needed for public, but for now PublicNavLinks takes space */}
                <div className="flex items-center gap-6">
                  {publicNavLinks.filter(link => link.show).map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`
                        font-medium transition-colors hover:text-primary-500
                        ${isActive(link.path)
                          ? 'text-primary-500'
                          : 'text-neutral-600'
                        }
                        `}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                <Link to="/login">
                  <Button variant="ghost" size="md" className="font-medium text-neutral-600 hover:text-neutral-900">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="md" className="shadow-md hover:shadow-lg transition-all">
                    Get Started
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-600"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu - Keep existing logic mostly, maybe update style */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-100 animate-slide-down bg-white/95 backdrop-blur-md absolute left-0 right-0 shadow-xl px-4">
            {/* Search in Mobile Menu */}
            <form onSubmit={(e) => { handleSearch(e); closeMobileMenu(); }} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all outline-none"
                />
                <svg
                  className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {isAuthenticated ? (
              // Authenticated Mobile Menu
              <div className="flex flex-col gap-2">
                {/* User Info */}
                <div className="px-4 py-3 bg-primary-50/50 rounded-xl mb-2 flex items-center gap-3 border border-primary-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{user?.name}</p>
                    <p className="text-xs text-neutral-600">{user?.email}</p>
                  </div>
                </div>

                {/* Quick Action */}
                <Link to="/books/create" onClick={closeMobileMenu}>
                  <Button variant="accent" size="md" className="w-full mb-2 shadow-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Book
                  </Button>
                </Link>

                {/* Navigation Links */}
                {authNavLinks.filter(link => link.show).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                      ${isActive(link.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-600'
                      }
                    `}
                    onClick={closeMobileMenu}
                  >
                    <span className="text-xl opacity-80">{link.icon}</span>
                    <span>{link.label}</span>
                    {link.badge > 0 && (
                      <Badge variant="error" className="ml-auto">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                ))}

                <div className="border-t border-neutral-100 my-2"></div>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>

                {/* Other standard mobile links... */}
                <Link
                  to="/profile/settings"
                  className="flex items-center gap-3 px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-error-600 hover:bg-error-50 rounded-xl transition-colors w-full text-left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              // Public Mobile Menu
              <div className="flex flex-col gap-3">
                {publicNavLinks.filter(link => link.show).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      px-4 py-3 rounded-xl font-medium transition-colors
                      ${isActive(link.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-600'
                      }
                    `}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="flex flex-col gap-3 mt-2 px-2">
                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button variant="primary" size="md" className="w-full shadow-md">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
