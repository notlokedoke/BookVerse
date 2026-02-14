import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Users, Target, Sparkles, Shield } from 'lucide-react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-header">
          <h1>
            <BookOpen size={48} className="about-icon" />
            About BookVerse
          </h1>
          <p className="intro-text">
            Connecting book lovers worldwide through the joy of sharing stories
          </p>
        </div>

        <section className="about-section">
          <h2>Our Story</h2>
          <div className="about-content">
            <p>
              BookVerse was born from a simple idea: books are meant to be shared. In a world where 
              countless books sit unread on shelves, I saw an opportunity to create a community where 
              book lovers could connect, exchange stories, and give their beloved books new homes.
            </p>
            <p>
              I believe that every book has a journey, and every reader has a story. BookVerse brings 
              these journeys together, creating meaningful connections between people who share a passion 
              for reading.
            </p>
          </div>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <div className="about-content">
            <div className="mission-grid">
              <div className="mission-card">
                <div className="mission-icon">
                  <Users size={32} />
                </div>
                <h3>Build Community</h3>
                <p>
                  Foster connections between book enthusiasts who share similar interests and reading tastes
                </p>
              </div>

              <div className="mission-card">
                <div className="mission-icon">
                  <Heart size={32} />
                </div>
                <h3>Promote Sustainability</h3>
                <p>
                  Give books a second life and reduce waste by encouraging reuse and sharing
                </p>
              </div>

              <div className="mission-card">
                <div className="mission-icon">
                  <Target size={32} />
                </div>
                <h3>Make Reading Accessible</h3>
                <p>
                  Help readers discover new books without the financial barrier of buying new
                </p>
              </div>

              <div className="mission-card">
                <div className="mission-icon">
                  <Shield size={32} />
                </div>
                <h3>Ensure Safety</h3>
                <p>
                  Create a trusted platform with safety guidelines and user ratings for peace of mind
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Our Values</h2>
          <div className="about-content">
            <div className="value-item">
              <h3><Sparkles size={20} className="inline-icon" /> Community First</h3>
              <p>
                We prioritize building a supportive, inclusive community where every member feels 
                welcome and valued. BookVerse is more than a trading platform—it's a space for 
                book lovers to connect and share their passion.
              </p>
            </div>

            <div className="value-item">
              <h3><Shield size={20} className="inline-icon" /> Trust & Safety</h3>
              <p>
                Your safety is our top priority. We implement robust security measures, provide 
                comprehensive safety guidelines, and maintain a rating system to ensure trustworthy 
                exchanges between community members.
              </p>
            </div>

            <div className="value-item">
              <h3><Heart size={20} className="inline-icon" /> Fairness & Transparency</h3>
              <p>
                We believe in honest book descriptions, fair trades, and transparent communication. 
                Our platform encourages integrity and accountability in every exchange.
              </p>
            </div>

            <div className="value-item">
              <h3><BookOpen size={20} className="inline-icon" /> Love of Reading</h3>
              <p>
                At our core, we're passionate about books and reading. We celebrate the joy of 
                discovering new stories, authors, and perspectives through the books we share.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <div className="about-content">
            <p>
              BookVerse makes book trading simple and enjoyable. Create your profile, list books 
              you'd like to trade, browse available books in your area, and propose trades with 
              fellow readers. Our built-in messaging system helps you coordinate exchanges, and 
              our rating system builds trust within the community.
            </p>
            <p>
              Whether you're looking to declutter your bookshelf, discover new reads, or connect 
              with other book lovers, BookVerse provides the tools and community to make it happen.
            </p>
          </div>
        </section>

        <section className="about-section highlight-section">
          <h2>Join Our Community</h2>
          <div className="about-content">
            <p className="highlight-text">
              Ready to start your book trading journey? Join thousands of readers who are already 
              sharing stories and building connections through BookVerse.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
              <Link to="/browse" className="btn-secondary">
                Browse Books
              </Link>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Contact Us</h2>
          <div className="about-content">
            <p>
              Have questions, feedback, or suggestions? We'd love to hear from you! Reach out to 
              our team and we'll get back to you as soon as possible.
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> support@bookverse.com</p>
              <p><strong>Community Guidelines:</strong> <Link to="/safety">Safety Guidelines</Link></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
