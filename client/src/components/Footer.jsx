import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, Mail, Github } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand">
              <BookOpen size={24} strokeWidth={2.5} />
              <span className="footer-logo-text">BookVerse</span>
            </div>
            <p className="footer-description">
              A community-driven platform for fair and secure book exchanges.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li>
                <Link to="/browse" className="footer-link">
                  Browse Books
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="footer-link">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-books" className="footer-link">
                  My Books
                </Link>
              </li>
              <li>
                <Link to="/trades" className="footer-link">
                  Trades
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              <li>
                <Link to="/safety" className="footer-link">
                  <Shield size={16} />
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <a href="mailto:support@bookverse.com" className="footer-link">
                  <Mail size={16} />
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h3 className="footer-heading">Legal</h3>
            <ul className="footer-links">
              <li>
                <Link to="/privacy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} BookVerse. All rights reserved.
          </p>
          <div className="footer-social">
            <a
              href="https://github.com/bookverse"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
