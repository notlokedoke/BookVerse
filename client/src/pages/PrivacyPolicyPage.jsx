import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-container">
        {/* Back Navigation */}
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Header */}
        <header className="privacy-header">
          <div className="header-icon">
            <Shield size={40} />
          </div>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: April 23, 2026</p>
        </header>

        {/* Table of Contents */}
        <nav className="table-of-contents">
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#introduction">1. Introduction</a></li>
            <li><a href="#information-we-collect">2. Information We Collect</a></li>
            <li><a href="#how-we-use">3. How We Use Your Information</a></li>
            <li><a href="#information-sharing">4. Information Sharing</a></li>
            <li><a href="#data-security">5. Data Security</a></li>
            <li><a href="#your-rights">6. Your Rights</a></li>
            <li><a href="#cookies">7. Cookies and Tracking</a></li>
            <li><a href="#children">8. Children's Privacy</a></li>
            <li><a href="#changes">9. Changes to This Policy</a></li>
            <li><a href="#contact">10. Contact Us</a></li>
          </ul>
        </nav>

        {/* Content */}
        <div className="privacy-content">
          {/* Introduction */}
          <section id="introduction">
            <h2>1. Introduction</h2>
            <p>
              Welcome to BookVerse. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our 
              peer-to-peer book trading platform.
            </p>
            <p>
              BookVerse is a community-driven platform that connects book lovers to trade and share books. 
              We only collect information necessary to provide and improve our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section id="information-we-collect">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Username, email address, password (encrypted), and city location</li>
              <li><strong>Profile Information:</strong> Optional profile details, reading preferences, and bio</li>
              <li><strong>Book Listings:</strong> Book details, condition, images, and descriptions you upload</li>
              <li><strong>Communications:</strong> Messages sent through our platform, trade proposals, and support inquiries</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
              <li><strong>Cookies:</strong> Session data and preferences (see Section 7)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section id="how-we-use">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Facilitate book trades between users</li>
              <li>Display your book listings to other users</li>
              <li>Enable communication between traders</li>
              <li>Send notifications about trades, messages, and account activity</li>
              <li>Improve our platform and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section id="information-sharing">
            <h2>4. Information Sharing</h2>
            
            <h3>4.1 With Other Users</h3>
            <p>
              When you list a book or propose a trade, certain information is visible to other users:
            </p>
            <ul>
              <li>Your username</li>
              <li>Your city (if you choose to make it visible in privacy settings)</li>
              <li>Your book listings and their details</li>
              <li>Your user rating and reviews</li>
            </ul>
            <p className="privacy-note">
              <strong>Privacy Control:</strong> You can control the visibility of your city and email 
              in your <Link to="/profile/settings">Privacy Settings</Link>.
            </p>

            <h3>4.2 We Do NOT Share Your Information With:</h3>
            <ul>
              <li>Third-party advertisers</li>
              <li>Data brokers or marketing companies</li>
              <li>Social media platforms (unless you explicitly connect them)</li>
            </ul>

            <h3>4.3 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or to protect the 
              rights, property, or safety of BookVerse, our users, or others.
            </p>
          </section>

          {/* Data Security */}
          <section id="data-security">
            <h2>5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul>
              <li><strong>Encryption:</strong> Passwords are encrypted using bcrypt hashing</li>
              <li><strong>Secure Transmission:</strong> All data is transmitted over HTTPS</li>
              <li><strong>Access Controls:</strong> Limited employee access to personal data</li>
              <li><strong>Regular Security Audits:</strong> We regularly review and update our security practices</li>
              <li><strong>Rate Limiting:</strong> Protection against brute force attacks</li>
            </ul>
            <p className="security-note">
              While we strive to protect your data, no method of transmission over the internet is 100% secure. 
              Please use strong passwords and keep your login credentials confidential.
            </p>
          </section>

          {/* Your Rights */}
          <section id="your-rights">
            <h2>6. Your Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            
            <div className="rights-grid">
              <div className="right-card">
                <h3>Access</h3>
                <p>Request a copy of your personal data</p>
              </div>
              <div className="right-card">
                <h3>Correction</h3>
                <p>Update or correct inaccurate information</p>
              </div>
              <div className="right-card">
                <h3>Deletion</h3>
                <p>Request deletion of your account and data</p>
              </div>
              <div className="right-card">
                <h3>Portability</h3>
                <p>Export your data in a readable format</p>
              </div>
              <div className="right-card">
                <h3>Objection</h3>
                <p>Object to certain data processing activities</p>
              </div>
              <div className="right-card">
                <h3>Restriction</h3>
                <p>Request limitation of data processing</p>
              </div>
            </div>

            <p>
              To exercise these rights, visit your <Link to="/profile/settings">Account Settings</Link> or 
              contact us at <a href="mailto:kandelkushal101@gmail.com">kandelkushal101@gmail.com</a>.
            </p>
          </section>

          {/* Cookies */}
          <section id="cookies">
            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Note that disabling certain cookies 
              may affect platform functionality.
            </p>
          </section>

          {/* Children's Privacy */}
          <section id="children">
            <h2>8. Children's Privacy</h2>
            <p>
              BookVerse is not intended for users under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you believe we have collected information 
              from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section id="changes">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant 
              changes by:
            </p>
            <ul>
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification for material changes</li>
            </ul>
            <p>
              Your continued use of BookVerse after changes indicates acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section id="contact">
            <h2>10. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this privacy policy or your personal data:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> <a href="mailto:kandelkushal101@gmail.com">kandelkushal101@gmail.com</a></p>
              <p><strong>Support:</strong> <Link to="/contact">Contact Form</Link></p>
              <p><strong>Help Center:</strong> <Link to="/help">Help Center</Link></p>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="privacy-footer-cta">
          <p>Have questions about your privacy?</p>
          <Link to="/contact" className="cta-button">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
