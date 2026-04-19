import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, ChevronDown, ChevronUp, BookOpen, Users, MessageCircle, Shield, Settings } from 'lucide-react';
import './HelpCenterPage.css';

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const faqData = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Users size={24} />,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Get Started" or "Sign Up" on the homepage. You can register with your email or use Google Sign-In for quick access. After registration, verify your email to activate your account.'
        },
        {
          q: 'Do I need to verify my email?',
          a: 'Yes, email verification is required to ensure account security and enable all platform features. Check your inbox for the verification email after signing up.'
        },
        {
          q: 'How do I complete my profile?',
          a: 'After registration, go to Profile Settings from the navbar. Add your city, bio, and profile picture. Your city helps connect you with local traders in your area for in-person book exchanges.'
        },
        {
          q: 'Is BookVerse free to use?',
          a: 'Yes! BookVerse is completely free. There are no listing fees, transaction fees, or subscription costs. We believe in making book trading accessible to everyone.'
        }
      ]
    },
    {
      id: 'book-listings',
      title: 'Book Listings',
      icon: <BookOpen size={24} />,
      questions: [
        {
          q: 'How do I list a book for trading?',
          a: 'Go to "My Books" and click "Add New Book". You can search for books using ISBN or title, upload a photo, select the condition, and add any notes. Click "List Book" to make it available for trading.'
        },
        {
          q: 'What book conditions can I choose?',
          a: 'We have five condition categories: New (unread), Like New (minimal wear), Good (normal reading wear), Fair (noticeable wear but readable), and Poor (significant wear but complete).'
        },
        {
          q: 'Can I edit or delete my book listings?',
          a: 'Yes! Go to "My Books", find the book you want to modify, and click the edit or delete button. You can update details, change photos, or remove listings anytime.'
        },
        {
          q: 'How many books can I list?',
          a: 'There is no limit! List as many books as you want to trade. The more books you list, the more trading opportunities you\'ll have.'
        }
      ]
    },
    {
      id: 'trading',
      title: 'Trading Process',
      icon: <MessageCircle size={24} />,
      questions: [
        {
          q: 'How do I propose a trade?',
          a: 'Browse available books, click on one you want, and click "Propose Trade". Select which of your books you want to offer in exchange, add an optional message, and submit the proposal.'
        },
        {
          q: 'What happens after I propose a trade?',
          a: 'The book owner receives a notification and can view your proposal in their Trades page. They can accept, decline, or message you to discuss the trade.'
        },
        {
          q: 'How do I accept or decline trade proposals?',
          a: 'Go to your Trades page to see incoming proposals. Click on a trade to view details, then choose to accept, decline, or message the proposer for more information.'
        },
        {
          q: 'How do I coordinate the book exchange?',
          a: 'Use the built-in messaging system to discuss meeting location, time, and exchange details. Always follow our safety guidelines and meet in public places.'
        },
        {
          q: 'What if the book condition doesn\'t match the description?',
          a: 'You have the right to decline the trade if the book condition is significantly different. Discuss with your trading partner and provide honest feedback in your rating.'
        }
      ]
    },
    {
      id: 'wishlist',
      title: 'Wishlist & Matching',
      icon: <Search size={24} />,
      questions: [
        {
          q: 'What is a wishlist?',
          a: 'A wishlist lets you save books you\'re looking for. When someone lists a book from your wishlist, you\'ll receive a notification about potential matches.'
        },
        {
          q: 'How do I add books to my wishlist?',
          a: 'Click "Create Wishlist" from the navbar, search for books by title, author, or ISBN, and add them to your wishlist. You can add as many books as you want.'
        },
        {
          q: 'Will I be notified of wishlist matches?',
          a: 'Yes! When someone lists a book from your wishlist, you\'ll receive an in-app notification so you can quickly propose a trade.'
        },
        {
          q: 'What is the "Local" feature?',
          a: 'The "Local" feature shows you all books available in your city for in-person trades. This makes it easy to find books nearby without needing to ship or travel long distances.'
        },
        {
          q: 'Why can I only see books in my city?',
          a: 'BookVerse focuses on local, in-person book exchanges to make trading convenient and build community. Meeting locally means no shipping costs, faster exchanges, and the chance to meet fellow book lovers in your area.'
        }
      ]
    },
    {
      id: 'messaging',
      title: 'Messaging',
      icon: <MessageCircle size={24} />,
      questions: [
        {
          q: 'How do I message other users?',
          a: 'You can message users through active trade proposals. Click on a trade in your Trades page to open the chat interface and communicate with your trading partner.'
        },
        {
          q: 'Can I message anyone on the platform?',
          a: 'No, messaging is only available for active trades. This helps maintain privacy and ensures conversations are trade-related.'
        },
        {
          q: 'Are my messages private?',
          a: 'Yes, all messages are private between you and your trading partner. We recommend keeping all communication on the platform for safety and record-keeping.'
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Trust',
      icon: <Shield size={24} />,
      questions: [
        {
          q: 'How do I stay safe when trading books?',
          a: 'Always meet in public places, bring a friend if possible, and trust your instincts. Read our complete Safety Guidelines for detailed tips on safe trading practices.'
        },
        {
          q: 'What is the rating system?',
          a: 'After completing a trade, both users can rate each other. Ratings help build trust in the community and help others make informed decisions about trading partners.'
        },
        {
          q: 'How do I report inappropriate behavior?',
          a: 'If you experience any safety concerns or inappropriate behavior, contact us immediately through the Contact page. Include details about the incident and the user involved.'
        },
        {
          q: 'Can I see a user\'s rating before trading?',
          a: 'Yes! User ratings and reviews are visible on their profile page. Check a user\'s reputation before proposing or accepting trades.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account Settings',
      icon: <Settings size={24} />,
      questions: [
        {
          q: 'How do I change my privacy settings?',
          a: 'Go to Profile Settings and toggle privacy options. You can control who sees your city and email address. Your privacy preferences are respected throughout the platform.'
        },
        {
          q: 'How do I change my password?',
          a: 'Go to Profile Settings and use the "Change Password" section. Enter your current password and your new password to update it.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can delete your account from Profile Settings. Note that this action is permanent and will remove all your data, including book listings and trade history.'
        },
        {
          q: 'How do I update my profile information?',
          a: 'Go to Profile Settings to update your name, bio, city, profile picture, and privacy preferences. Changes are saved automatically.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <HelpCircle size={24} />,
      questions: [
        {
          q: 'I didn\'t receive the verification email',
          a: 'Check your spam folder first. If you still don\'t see it, go to the login page and click "Resend Verification Email". Make sure you entered the correct email address.'
        },
        {
          q: 'I forgot my password',
          a: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. The link expires in 1 hour for security.'
        },
        {
          q: 'My book images aren\'t uploading',
          a: 'Make sure your image is in JPEG, PNG, or WebP format and under 5MB. Try using a different browser or clearing your cache if the issue persists.'
        },
        {
          q: 'I can\'t find a specific book',
          a: 'Try different search terms - search by title, author, or ISBN. Use the filters to narrow results by genre, condition, or location. Not all books may be available in your area.'
        },
        {
          q: 'The website isn\'t loading properly',
          a: 'Try refreshing the page, clearing your browser cache, or using a different browser. Make sure you have a stable internet connection. If issues persist, contact us.'
        }
      ]
    }
  ];

  // Filter FAQ data based on search query
  const filteredFaqData = searchQuery.trim() === '' 
    ? faqData 
    : faqData.map(section => ({
        ...section,
        questions: section.questions.filter(item => 
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.questions.length > 0);

  return (
    <div className="help-center-page">
      <div className="help-center-container">
        <div className="help-header">
          <h1>
            <HelpCircle size={48} className="help-icon" />
            Help Center
          </h1>
          <p className="intro-text">
            Find answers to common questions about using BookVerse
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <h2>Quick Links</h2>
          <div className="quick-links-grid">
            <Link to="/about" className="quick-link-card">
              <BookOpen size={24} />
              <span>About BookVerse</span>
            </Link>
            <Link to="/safety" className="quick-link-card">
              <Shield size={24} />
              <span>Safety Guidelines</span>
            </Link>
            <Link to="/contact" className="quick-link-card">
              <MessageCircle size={24} />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="faq-sections">
          {filteredFaqData.length === 0 ? (
            <div className="no-results">
              <p>No results found for "{searchQuery}". Try different keywords or browse categories below.</p>
            </div>
          ) : (
            filteredFaqData.map(section => (
              <div key={section.id} className="faq-section">
                <div className="section-header">
                  <div className="section-title-wrapper">
                    {section.icon}
                    <h2>{section.title}</h2>
                  </div>
                </div>
                <div className="questions-list">
                  {section.questions.map((item, index) => {
                    const itemId = `${section.id}-${index}`;
                    const isOpen = openSections[itemId];
                    
                    return (
                      <div key={itemId} className="faq-item">
                        <button
                          className="faq-question"
                          onClick={() => toggleSection(itemId)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.q}</span>
                          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {isOpen && (
                          <div className="faq-answer">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Still Need Help Section */}
        <div className="still-need-help">
          <h2>Still Need Help?</h2>
          <p>
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link to="/contact" className="contact-button">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
