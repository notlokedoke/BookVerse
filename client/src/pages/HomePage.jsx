import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Search, Users, Shield, TrendingUp, ArrowRight, Sparkles, Heart, MessageCircle } from 'lucide-react'
import './HomePage.css'

const HomePage = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // If user is authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="landing-page">
      {/* Modern Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <BookOpen size={24} strokeWidth={2.5} />
            <span className="logo-text">BookVerse</span>
          </Link>

          <div className="navbar-menu">
            <Link to="/browse" className="navbar-link">
              <Search size={18} />
              <span>Browse</span>
            </Link>
            <a href="#how-it-works" className="navbar-link">How It Works</a>
            <a href="#features" className="navbar-link">Features</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login" className="btn-signin">Sign In</Link>
            <Link to="/register" className="btn-getstarted">
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            onClick={toggleMobileMenu}
            className="mobile-toggle"
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/browse" className="mobile-nav-link" onClick={toggleMobileMenu}>
              <Search size={20} />
              Browse
            </Link>
            <a href="#how-it-works" className="mobile-nav-link" onClick={toggleMobileMenu}>
              How It Works
            </a>
            <a href="#features" className="mobile-nav-link" onClick={toggleMobileMenu}>
              Features
            </a>
            <div className="mobile-auth-btns">
              <Link to="/login" className="mobile-signin" onClick={toggleMobileMenu}>
                Sign In
              </Link>
              <Link to="/register" className="mobile-getstarted" onClick={toggleMobileMenu}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>Join Other Book Lovers</span>
            </div>
            <h1 className="hero-title">
              Trade Books with
              <span className="gradient-text"> Fellow Readers</span>
            </h1>
            <p className="hero-subtitle">
              Connect with book enthusiasts in your area. Share stories, discover new reads, and build your personal library through meaningful exchanges.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-hero-primary">
                Start Trading
                <ArrowRight size={20} />
              </Link>
              <Link to="/browse" className="btn-hero-secondary">
                <Search size={20} />
                Browse Books
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header-center">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              Start trading books in three simple steps
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon gradient-blue">
                <Users size={28} />
              </div>
              <div className="step-number">01</div>
              <h3>Create Your Profile</h3>
              <p>Sign up and set up your profile to connect with other book lovers in your community.</p>
            </div>

            <div className="step-card">
              <div className="step-icon gradient-green">
                <BookOpen size={28} />
              </div>
              <div className="step-number">02</div>
              <h3>List Your Books</h3>
              <p>Add books you want to trade with photos and descriptions. Build your trading library.</p>
            </div>

            <div className="step-card">
              <div className="step-icon gradient-amber">
                <Heart size={28} />
              </div>
              <div className="step-number">03</div>
              <h3>Start Trading</h3>
              <p>Browse available books, propose trades, and connect with readers near you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header-center">
            <h2 className="section-title">Why Choose BookVerse</h2>
            <p className="section-description">
              Everything you need for a seamless book trading experience
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper gradient-blue">
                <Search size={24} />
              </div>
              <h3>Smart Search</h3>
              <p>Advanced filters to find exactly what you're looking for by genre, author, location, and condition.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper gradient-green">
                <Shield size={24} />
              </div>
              <h3>Safe & Secure</h3>
              <p>User ratings, verified profiles, and safety guidelines to ensure trustworthy trades.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper gradient-amber">
                <MessageCircle size={24} />
              </div>
              <h3>Built-in Chat</h3>
              <p>Coordinate trades easily with our secure messaging system. No need for external apps.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper gradient-pink">
                <TrendingUp size={24} />
              </div>
              <h3>Track Progress</h3>
              <p>Monitor your trades, wishlist matches, and build your reading history over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Ready to Start Trading?</h2>
            <p>Join thousands of book lovers and discover your next great read today.</p>
            <Link to="/register" className="btn-cta">
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <BookOpen size={24} />
                <span>BookVerse</span>
              </div>
              <p>Connecting book lovers worldwide through the joy of sharing stories.</p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/browse">Browse Books</Link>
                <Link to="/register">Sign Up</Link>
                <Link to="/login">Login</Link>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About Us</a>
                <a href="#contact">Contact</a>
                <a href="#help">Help Center</a>
              </div>

              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
                <a href="#safety">Safety Guidelines</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 BookVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
