import React from 'react';
import './SafetyGuidelinesPage.css';

const SafetyGuidelinesPage = () => {
  return (
    <div className="safety-guidelines-page">
      <div className="safety-container">
        <h1>Safety Guidelines</h1>
        <p className="intro-text">
          BookVerse is a community-driven platform for book lovers. Your safety is our priority. 
          Please follow these guidelines to ensure safe and positive trading experiences.
        </p>

        <section className="guideline-section">
          <h2>Safe In-Person Exchanges</h2>
          <div className="guideline-content">
            <h3>Meeting Location</h3>
            <ul>
              <li>Always meet in well-lit, public places with other people around</li>
              <li>Consider meeting at libraries, bookstores, coffee shops, or community centers</li>
              <li>Avoid meeting at private residences or isolated locations</li>
              <li>If possible, choose locations with security cameras</li>
            </ul>

            <h3>Bring Support</h3>
            <ul>
              <li>Bring a friend or family member with you to the exchange</li>
              <li>Let someone know where you're going and when you expect to return</li>
              <li>Share the meeting location and time with a trusted contact</li>
              <li>Keep your phone charged and accessible</li>
            </ul>

            <h3>During the Exchange</h3>
            <ul>
              <li>Inspect the book condition before completing the trade</li>
              <li>Trust your instincts - if something feels wrong, leave</li>
              <li>Be respectful and courteous to your trading partner</li>
              <li>Complete the exchange during daylight hours when possible</li>
            </ul>
          </div>
        </section>

        <section className="guideline-section">
          <h2>Online Safety</h2>
          <div className="guideline-content">
            <h3>Protect Your Privacy</h3>
            <ul>
              <li>Use the platform's messaging system for communication</li>
              <li>Don't share personal information like your home address, phone number, or financial details</li>
              <li>Use the privacy toggle to control visibility of your city information</li>
              <li>Be cautious about sharing social media profiles</li>
            </ul>

            <h3>Account Security</h3>
            <ul>
              <li>Use a strong, unique password for your BookVerse account</li>
              <li>Never share your password with anyone</li>
              <li>Log out when using shared or public computers</li>
              <li>Report suspicious activity to our support team</li>
            </ul>
          </div>
        </section>

        <section className="guideline-section">
          <h2>Community Guidelines</h2>
          <div className="guideline-content">
            <h3>Fair Trading Practices</h3>
            <ul>
              <li>Accurately describe book conditions in your listings</li>
              <li>Honor your trade commitments once accepted</li>
              <li>Communicate promptly and clearly with trading partners</li>
              <li>Complete trades in a timely manner</li>
            </ul>

            <h3>Respectful Behavior</h3>
            <ul>
              <li>Treat all community members with respect and kindness</li>
              <li>Use appropriate language in messages and comments</li>
              <li>Provide honest and constructive ratings</li>
              <li>Report inappropriate behavior or harassment</li>
            </ul>

            <h3>Non-Commercial Use</h3>
            <ul>
              <li>BookVerse is for personal book trading, not commercial sales</li>
              <li>Don't use the platform for business purposes or bulk trading</li>
              <li>Avoid listing books solely for profit</li>
              <li>Focus on building community connections through shared reading interests</li>
            </ul>
          </div>
        </section>

        <section className="guideline-section">
          <h2>Red Flags to Watch For</h2>
          <div className="guideline-content">
            <ul>
              <li>Requests to meet in isolated or private locations</li>
              <li>Pressure to complete trades quickly without proper communication</li>
              <li>Requests for personal information or financial details</li>
              <li>Aggressive or threatening behavior</li>
              <li>Offers that seem too good to be true</li>
              <li>Users with consistently negative ratings or no rating history</li>
            </ul>
          </div>
        </section>

        <section className="guideline-section">
          <h2>Reporting Issues</h2>
          <div className="guideline-content">
            <p>
              If you experience any safety concerns, inappropriate behavior, or violations of these guidelines, 
              please report them immediately. We take all reports seriously and will investigate promptly.
            </p>
            <ul>
              <li>Use the report feature on user profiles or trade pages</li>
              <li>Contact our support team with detailed information</li>
              <li>If you feel you're in immediate danger, contact local authorities</li>
            </ul>
          </div>
        </section>

        <section className="guideline-section remember-section">
          <h2>Remember</h2>
          <div className="guideline-content">
            <p className="highlight-text">
              Your safety is paramount. If a situation doesn't feel right, trust your instincts and 
              prioritize your well-being over completing a trade. BookVerse is here to facilitate 
              safe and enjoyable book exchanges within our community.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SafetyGuidelinesPage;
