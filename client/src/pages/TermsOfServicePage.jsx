import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import './TermsOfServicePage.css';

const TermsOfServicePage = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        {/* Back Navigation */}
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Header */}
        <header className="terms-header">
          <div className="header-icon">
            <FileText size={40} />
          </div>
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: April 23, 2026</p>
        </header>

        {/* Table of Contents */}
        <nav className="table-of-contents">
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#acceptance">1. Acceptance of Terms</a></li>
            <li><a href="#eligibility">2. Eligibility</a></li>
            <li><a href="#account">3. Account Registration</a></li>
            <li><a href="#user-conduct">4. User Conduct</a></li>
            <li><a href="#book-listings">5. Book Listings</a></li>
            <li><a href="#trades">6. Trading Process</a></li>
            <li><a href="#prohibited">7. Prohibited Activities</a></li>
            <li><a href="#intellectual-property">8. Intellectual Property</a></li>
            <li><a href="#disclaimers">9. Disclaimers</a></li>
            <li><a href="#limitation">10. Limitation of Liability</a></li>
            <li><a href="#termination">11. Termination</a></li>
            <li><a href="#changes">12. Changes to Terms</a></li>
            <li><a href="#contact">13. Contact Us</a></li>
          </ul>
        </nav>

        {/* Content */}
        <div className="terms-content">
          {/* Acceptance of Terms */}
          <section id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to BookVerse! By accessing or using our platform, you agree to be bound by these 
              Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our service.
            </p>
            <p>
              BookVerse is a peer-to-peer book trading platform that connects book lovers to exchange 
              books directly with each other. We facilitate connections but are not a party to the actual 
              trades between users.
            </p>
          </section>

          {/* Eligibility */}
          <section id="eligibility">
            <h2>2. Eligibility</h2>
            <p>To use BookVerse, you must:</p>
            <ul>
              <li>Be at least 13 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
            <p>
              Users under 18 should use BookVerse under parental supervision and guidance.
            </p>
          </section>

          {/* Account Registration */}
          <section id="account">
            <h2>3. Account Registration</h2>
            
            <h3>3.1 Account Creation</h3>
            <p>To access certain features, you must create an account by providing:</p>
            <ul>
              <li>A valid email address</li>
              <li>A unique username</li>
              <li>A secure password</li>
              <li>Your city location (for local trading)</li>
            </ul>

            <h3>3.2 Account Security</h3>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Ensuring your account information remains accurate and up-to-date</li>
            </ul>

            <h3>3.3 Account Termination</h3>
            <p>
              You may delete your account at any time through your <Link to="/profile/settings">Account Settings</Link>. 
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          {/* User Conduct */}
          <section id="user-conduct">
            <h2>4. User Conduct</h2>
            <p>As a BookVerse user, you agree to:</p>
            
            <div className="conduct-grid">
              <div className="conduct-card do">
                <h3>✓ Do</h3>
                <ul>
                  <li>Treat other users with respect</li>
                  <li>Provide accurate book descriptions</li>
                  <li>Honor your trade commitments</li>
                  <li>Communicate promptly and honestly</li>
                  <li>Report suspicious activity</li>
                  <li>Follow our <Link to="/safety">Safety Guidelines</Link></li>
                </ul>
              </div>

              <div className="conduct-card dont">
                <h3>✗ Don't</h3>
                <ul>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Post false or misleading information</li>
                  <li>Engage in fraudulent activities</li>
                  <li>Share inappropriate content</li>
                  <li>Spam or solicit users</li>
                  <li>Violate any laws or regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Book Listings */}
          <section id="book-listings">
            <h2>5. Book Listings</h2>
            
            <h3>5.1 Creating Listings</h3>
            <p>When listing a book, you must:</p>
            <ul>
              <li>Provide accurate information about the book's condition</li>
              <li>Use clear, representative photos</li>
              <li>Describe any damage, markings, or defects honestly</li>
              <li>Only list books you legally own and have the right to trade</li>
            </ul>

            <h3>5.2 Book Conditions</h3>
            <p>We use the following condition categories:</p>
            <ul>
              <li><strong>Like New:</strong> Minimal wear, excellent condition</li>
              <li><strong>Good:</strong> Normal reading wear, fully readable</li>
              <li><strong>Fair:</strong> Noticeable wear but still usable</li>
              <li><strong>Poor:</strong> Significant wear but complete</li>
            </ul>

            <h3>5.3 Prohibited Items</h3>
            <p>You may not list:</p>
            <ul>
              <li>Pirated, counterfeit, or illegally obtained books</li>
              <li>Books with illegal, harmful, or offensive content</li>
              <li>Items that are not books (unless explicitly allowed)</li>
              <li>Books you do not physically possess</li>
            </ul>
          </section>

          {/* Trading Process */}
          <section id="trades">
            <h2>6. Trading Process</h2>
            
            <h3>6.1 Trade Proposals</h3>
            <p>
              Users can propose trades by offering their books in exchange for others' books. 
              Both parties must agree to the trade terms before proceeding.
            </p>

            <h3>6.2 Communication</h3>
            <p>
              Use our messaging system to discuss trade details, arrange meetups, or coordinate shipping. 
              Keep all communication respectful and on-platform for safety.
            </p>

            <h3>6.3 Meeting in Person</h3>
            <p>For local trades, we strongly recommend:</p>
            <ul>
              <li>Meeting in public, well-lit locations</li>
              <li>Bringing a friend or family member</li>
              <li>Inspecting books before completing the trade</li>
              <li>Following our <Link to="/safety">Safety Guidelines</Link></li>
            </ul>

            <h3>6.4 Shipping</h3>
            <p>
              If shipping books, users are responsible for:
            </p>
            <ul>
              <li>Packaging books securely</li>
              <li>Paying shipping costs (unless agreed otherwise)</li>
              <li>Providing tracking information when available</li>
              <li>Ensuring books arrive as described</li>
            </ul>

            <h3>6.5 Disputes</h3>
            <p>
              BookVerse is not responsible for disputes between users. We encourage users to 
              communicate openly and resolve issues amicably. For serious concerns, contact our 
              support team at <a href="mailto:kandelkushal101@gmail.com">kandelkushal101@gmail.com</a>.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section id="prohibited">
            <h2>7. Prohibited Activities</h2>
            <p>The following activities are strictly prohibited:</p>
            <ul>
              <li>Using the platform for commercial purposes without authorization</li>
              <li>Scraping, data mining, or automated data collection</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Impersonating other users or entities</li>
              <li>Posting malicious code, viruses, or harmful content</li>
              <li>Manipulating ratings or reviews</li>
              <li>Creating multiple accounts to circumvent restrictions</li>
              <li>Using the platform for any illegal activities</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property">
            <h2>8. Intellectual Property</h2>
            
            <h3>8.1 BookVerse Content</h3>
            <p>
              All content on BookVerse, including text, graphics, logos, and software, is owned by 
              BookVerse or its licensors and protected by copyright and trademark laws.
            </p>

            <h3>8.2 User Content</h3>
            <p>
              You retain ownership of content you post (book descriptions, photos, messages). By posting 
              content, you grant BookVerse a non-exclusive, worldwide license to use, display, and 
              distribute your content on the platform.
            </p>

            <h3>8.3 Copyright Infringement</h3>
            <p>
              We respect intellectual property rights. If you believe content on BookVerse infringes 
              your copyright, contact us at <a href="mailto:kandelkushal101@gmail.com">kandelkushal101@gmail.com</a>.
            </p>
          </section>

          {/* Disclaimers */}
          <section id="disclaimers">
            <h2>9. Disclaimers</h2>
            
            <div className="disclaimer-box">
              <h3>Important Notice</h3>
              <p>
                BookVerse is provided "as is" and "as available" without warranties of any kind, 
                either express or implied.
              </p>
            </div>

            <h3>9.1 No Guarantee of Service</h3>
            <p>We do not guarantee that:</p>
            <ul>
              <li>The platform will be uninterrupted, secure, or error-free</li>
              <li>Defects will be corrected</li>
              <li>The platform is free of viruses or harmful components</li>
              <li>Results from using the platform will meet your expectations</li>
            </ul>

            <h3>9.2 User Interactions</h3>
            <p>
              BookVerse is not responsible for:
            </p>
            <ul>
              <li>The conduct of users on or off the platform</li>
              <li>The accuracy of book descriptions or user information</li>
              <li>The quality, safety, or legality of books traded</li>
              <li>The completion or outcome of trades</li>
              <li>Any disputes between users</li>
            </ul>

            <h3>9.3 Third-Party Content</h3>
            <p>
              We may display book information from third-party sources (e.g., Google Books API). 
              We are not responsible for the accuracy or availability of third-party content.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section id="limitation">
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, BookVerse and its affiliates, officers, 
              employees, and agents shall not be liable for:
            </p>
            <ul>
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or use</li>
              <li>Damages resulting from user interactions or trades</li>
              <li>Unauthorized access to or alteration of your content</li>
              <li>Any other matter relating to the service</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid to use BookVerse 
              (which is currently $0, as the service is free).
            </p>
          </section>

          {/* Termination */}
          <section id="termination">
            <h2>11. Termination</h2>
            
            <h3>11.1 By You</h3>
            <p>
              You may terminate your account at any time through your 
              <Link to="/profile/settings"> Account Settings</Link>.
            </p>

            <h3>11.2 By Us</h3>
            <p>We may suspend or terminate your account if:</p>
            <ul>
              <li>You violate these Terms</li>
              <li>You engage in fraudulent or illegal activities</li>
              <li>Your account has been inactive for an extended period</li>
              <li>We are required to do so by law</li>
              <li>We decide to discontinue the service</li>
            </ul>

            <h3>11.3 Effect of Termination</h3>
            <p>Upon termination:</p>
            <ul>
              <li>Your access to the platform will be revoked</li>
              <li>Your content may be deleted (subject to our data retention policies)</li>
              <li>You remain responsible for any outstanding obligations</li>
              <li>Sections of these Terms that should survive will remain in effect</li>
            </ul>
          </section>

          {/* Changes to Terms */}
          <section id="changes">
            <h2>12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes by:
            </p>
            <ul>
              <li>Posting the updated Terms on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification for material changes</li>
            </ul>
            <p>
              Your continued use of BookVerse after changes indicates acceptance of the updated Terms. 
              If you do not agree to the changes, you should stop using the platform and delete your account.
            </p>
          </section>

          {/* Contact */}
          <section id="contact">
            <h2>13. Contact Us</h2>
            <p>
              If you have questions, concerns, or feedback regarding these Terms of Service:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> <a href="mailto:kandelkushal101@gmail.com">kandelkushal101@gmail.com</a></p>
              <p><strong>Support:</strong> <Link to="/contact">Contact Form</Link></p>
              <p><strong>Help Center:</strong> <Link to="/help">Help Center</Link></p>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="terms-footer-cta">
          <p>Ready to start trading books?</p>
          <Link to="/register" className="cta-button">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
