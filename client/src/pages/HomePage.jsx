import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './HomePage.css'

const HomePage = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // If user is authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-brand">
              <Link to="/">
                <span className="brand-icon">📚</span>
                <span className="brand-text">BookVerse</span>
              </Link>
            </div>
            
            <div className="navbar-menu">
              <Link to="/browse" className="navbar-link">Browse Books</Link>
              <a href="#how-it-works" className="navbar-link">How It Works</a>
              <a href="#about" className="navbar-link">About</a>
            </div>
            
            <div className="navbar-auth">
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn btn-nav-signup">Sign Up</Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <Link to="/browse" className="mobile-menu-link" onClick={closeMobileMenu}>
              Browse Books
            </Link>
            <a href="#how-it-works" className="mobile-menu-link" onClick={closeMobileMenu}>
              How It Works
            </a>
            <a href="#about" className="mobile-menu-link" onClick={closeMobileMenu}>
              About
            </a>
            <Link to="/login" className="mobile-menu-link" onClick={closeMobileMenu}>
              Login
            </Link>
            <Link to="/register" className="btn btn-nav-signup mobile-signup" onClick={closeMobileMenu}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Trade Books with Others</h1>
              <p className="hero-subtitle">Connect with fellow book lovers and discover your next great read</p>
              <div className="hero-buttons">
                <Link to="/browse" className="btn btn-primary">Browse Books</Link>
                <Link to="/register" className="btn btn-secondary">Join Us Now</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Getting started is easy! Follow these simple steps to begin trading books.</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Sign Up & Create Profile</h3>
              <p>Create your account and set up your profile to start connecting with other book lovers.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>List Your Books</h3>
              <p>Add books you want to trade with photos, descriptions, and condition details.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Find & Trade</h3>
              <p>Browse available books, propose trades, and connect with other readers in your area.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <p className="section-subtitle">Everything you need for a great book trading experience</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Smart Matching</h3>
              <p>Our algorithm helps you find books that match your interests and reading preferences.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Advanced Search</h3>
              <p>Filter by location, genre, author, and condition to find exactly what you're looking for.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Safe Communication</h3>
              <p>Built-in messaging system to coordinate trades safely and securely.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>User Ratings</h3>
              <p>Rate and review other traders to build trust within the community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section id="about" className="trust-safety">
        <div className="container">
          <div className="trust-content">
            <div className="trust-text">
              <h2>Trust & Safety</h2>
              <p>Your safety is our priority. We provide tools and guidelines to ensure secure book trading.</p>
              <ul className="trust-features">
                <li>✓ Verified user profiles</li>
                <li>✓ Community ratings and reviews</li>
                <li>✓ Safe meeting guidelines</li>
                <li>✓ Report and block features</li>
              </ul>
            </div>
            <div className="trust-image">
              <div className="safety-badge">
                <span className="badge-icon">🛡️</span>
                <span className="badge-text">Safe & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact">
        <div className="container">
          <h2 className="section-title">Our Impact</h2>
          <p className="section-subtitle">Join a growing community of book lovers</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">1,500+</div>
              <div className="stat-label">Active Users</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Books Traded</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">300+</div>
              <div className="stat-label">Cities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="featured-books">
        <div className="container">
          <h2 className="section-title">Featured Books</h2>
          <p className="section-subtitle">Popular books currently available for trade</p>
          
          <div className="books-grid">
            <div className="book-card">
              <div className="book-cover">📖</div>
              <h4>The Great Gatsby</h4>
              <p>F. Scott Fitzgerald</p>
            </div>
            
            <div className="book-card">
              <div className="book-cover">📚</div>
              <h4>To Kill a Mockingbird</h4>
              <p>Harper Lee</p>
            </div>
            
            <div className="book-card">
              <div className="book-cover">📘</div>
              <h4>1984</h4>
              <p>George Orwell</p>
            </div>
            
            <div className="book-card">
              <div className="book-cover">📗</div>
              <h4>Pride and Prejudice</h4>
              <p>Jane Austen</p>
            </div>
          </div>
          
          <div className="featured-cta">
            <Link to="/browse" className="btn btn-outline">View All Books</Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">What Our Users Say</h2>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"BookVerse has completely changed how I discover new books. The community is amazing!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div className="author-info">
                  <h4>Sarah Johnson</h4>
                  <span>Book Enthusiast</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"I've traded over 50 books and met so many wonderful people. Highly recommend!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div className="author-info">
                  <h4>Mike Chen</h4>
                  <span>Avid Reader</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Join Section */}
      <section className="ready-to-join">
        <div className="container">
          <div className="join-content">
            <h2>Ready to Join Us?</h2>
            <p>Start your book trading journey today and connect with readers in your community.</p>
            <Link to="/register" className="btn btn-primary btn-large">Get Started</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>BookVerse</h3>
              <p>Connecting book lovers worldwide through the joy of sharing stories.</p>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/browse">Browse Books</Link></li>
                <li><Link to="/register">Sign Up</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#safety">Safety Guidelines</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
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