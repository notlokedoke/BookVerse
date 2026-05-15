import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, ChevronDown, ChevronUp, BookOpen, Users, MessageCircle, Shield, Settings, Heart, AlertCircle, Mail } from 'lucide-react';
import './FAQPage.css';

const FAQPage = () => {
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
          a: 'Click "Get Started" or "Sign Up" on the homepage. Register with your email address or use "Continue with Google" for one-click access. After email registration, check your inbox for a verification link and click it to activate your account.'
        },
        {
          q: 'Do I need to verify my email?',
          a: 'Yes, for email registrations. Verification activates all platform features. If the email does not arrive, check your Spam or Junk folder, then use "Resend Verification Email" on the verification error page or from Settings → Account. Google sign-in accounts skip this step — they are already verified.'
        },
        {
          q: 'How do I complete my profile?',
          a: 'After registering, go to Settings → Profile. Add your city (required for local trading), an optional bio (up to 500 characters), and review your notification and privacy preferences. Google users who skipped the city step during sign-up can add it here.'
        },
        {
          q: 'Is BookVerse free to use?',
          a: 'Yes. There are no listing fees, transaction fees, or subscriptions.'
        },
        {
          q: 'What is the minimum age?',
          a: 'You must be at least 13 years old. Users under 18 should use the platform under parental supervision.'
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
          a: 'Go to "My Books" and click "Add Book". The fastest method is to enter the book\'s ISBN — BookVerse fills in the title, author, publisher, year, description, and cover image automatically from Open Library. Select a condition, optionally add photos, and submit.'
        },
        {
          q: 'What condition grades are available?',
          a: 'Like New: Minimal wear, unread or barely read, no marks, tight spine. Good: Some wear, fully readable, light scuffs or small crease, no writing. Fair: Noticeable wear, worn spine, yellowed pages, possible minor writing. Poor: Heavy wear, may have torn pages, heavy markings, or broken spine. Be honest — misrepresented condition leads to disputes and negative ratings.'
        },
        {
          q: 'Can I edit or delete my listings?',
          a: 'Yes. Go to "My Books", find the listing, and use the edit or delete option at any time.'
        },
        {
          q: 'How many books can I list?',
          a: 'There is no limit.'
        },
        {
          q: 'What is ISBN lookup?',
          a: 'ISBN lookup queries Open Library for metadata (title, author, publisher, year, cover) and Google Books for the description if Open Library does not have one. Enter the ISBN in the lookup field and click "Look Up Book". Both ISBN-10 and ISBN-13 formats are accepted — hyphens are stripped automatically.'
        },
        {
          q: 'What are the photo requirements?',
          a: 'Formats: JPEG, PNG, WebP. Maximum size: 10 MB per image. First image → front cover in search results; second image → back cover. Upload by drag-and-drop or the file picker; reorder by dragging thumbnails.'
        },
        {
          q: 'What is the draft save feature?',
          a: 'The Add Book form saves your progress as a draft in your browser for up to 24 hours. It reloads when you return to the page. Drafts are stored locally — clearing browser data or switching devices will lose the draft.'
        }
      ]
    },
    {
      id: 'trading-process',
      title: 'Trading Process',
      icon: <MessageCircle size={24} />,
      questions: [
        {
          q: 'How do I propose a trade?',
          a: 'Open any book listing and click "Propose Trade". Select one of your available listed books to offer, then click "Send Proposal". You must have at least one available listed book.'
        },
        {
          q: 'What are the trade statuses?',
          a: 'Proposed: Sent and awaiting the receiver\'s response. Accepted: Receiver agreed — coordinate the physical handoff. Declined: Receiver declined — both books remain available. Completed: Exchange done — rating unlocked for both parties.'
        },
        {
          q: 'How do I accept or decline a proposal?',
          a: 'Go to "My Trades → Incoming". Open the trade and click "Accept" or "Decline". Only the receiver can respond. Only proposed trades can be accepted or declined.'
        },
        {
          q: 'How do I mark a trade complete?',
          a: 'Open an accepted trade in "My Trades" and click "Mark as Complete". Either party can do this. Only mark complete after you have physically received and inspected your book — this action cannot be undone.'
        },
        {
          q: 'Can I cancel an accepted trade?',
          a: 'There is no cancel button. Contact the other trader via messages, agree not to complete the exchange, and leave the trade in the accepted state.'
        },
        {
          q: 'What if the book condition does not match the listing?',
          a: 'Inspect the book before finalising the exchange. If the condition is significantly different, you are entitled to decline. Discuss the discrepancy calmly, then reflect the outcome honestly in your rating.'
        }
      ]
    },
    {
      id: 'wishlist-matching',
      title: 'Wishlist and Matching',
      icon: <Heart size={24} />,
      questions: [
        {
          q: 'What is the wishlist?',
          a: 'A personal list of books you want to trade for. BookVerse checks all active listings against your wishlist and shows matches on your Dashboard and the Matches page. Making items public lets traders who own those books find you.'
        },
        {
          q: 'How do I add books to my wishlist?',
          a: 'From a listing — open any book detail page and click the heart button (♥ Add to Wishlist). Manually — go to "My Wishlist → + Add Book", search by title, author, or ISBN, select a result, optionally set notes and priority, then click "Add to Wishlist".'
        },
        {
          q: 'Will I be notified of wishlist matches?',
          a: 'Yes — via email (if "Wishlist Matches" notifications are on in Settings → Notifications, which is the default) and in-app on your Dashboard.'
        },
        {
          q: 'How does matching work?',
          a: 'Three levels, in order: 1) Exact ISBN match (score 100) — most reliable. 2) Title + Author match (score 90) — catches the same book across editions. 3) Fuzzy title match (score 60–89) — partial match; results below 60% are excluded. Your own listings are never included in match results.'
        },
        {
          q: 'What is the priority on a wishlist item?',
          a: 'A number from 1 (low) to 5 (high). It sorts your public wishlist on your profile so traders see your most urgent needs first. The matching engine treats all priorities equally.'
        }
      ]
    },
    {
      id: 'messaging',
      title: 'Messaging',
      icon: <MessageCircle size={24} />,
      questions: [
        {
          q: 'How do I message another trader?',
          a: 'Open a trade in "My Trades" and use the message interface to communicate with your trading partner.'
        },
        {
          q: 'Can I message anyone on the platform?',
          a: 'No. Messaging is only available between parties in an active trade. This maintains privacy and keeps conversations trade-related.'
        },
        {
          q: 'Are messages private?',
          a: 'Yes. Messages are private between you and your trading partner. Keep all communication on the platform — this provides a record if a dispute arises.'
        }
      ]
    },
    {
      id: 'safety-trust',
      title: 'Safety and Trust',
      icon: <Shield size={24} />,
      questions: [
        {
          q: 'How do I stay safe when meeting in person?',
          a: 'Meet in public, well-lit places (libraries, cafes, bookshops, shopping centres). Bring a friend if possible and tell someone where you are going. Inspect the book before completing the exchange. Trust your instincts — leave if anything feels wrong.'
        },
        {
          q: 'What is the rating system?',
          a: 'After a trade is completed, both parties can rate each other from 1 to 5 stars. A comment is required for ratings of 3 stars or lower. Ratings are permanent, averaged across all trades, and displayed publicly on the trader\'s profile.'
        },
        {
          q: 'Can I see a user\'s rating before trading?',
          a: 'Yes. A trader\'s average star rating, total rating count, and individual ratings with comments are all visible on their public profile. No account is needed to view them.'
        },
        {
          q: 'How do I report inappropriate behaviour?',
          a: 'Use the "Report" feature on user profiles or trade pages, or contact the support team through the Help Center with the user\'s name, a description of the incident, and any screenshots. For immediate physical danger, contact your local emergency services.'
        }
      ]
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      icon: <Settings size={24} />,
      questions: [
        {
          q: 'How do I change my password?',
          a: 'Go to Settings → Account → Change Password. Enter your current password, then a new one (minimum 8 characters, one uppercase letter, one number), confirm it, and click "Update Password". This is only available for email-registered accounts.'
        },
        {
          q: 'How do I manage privacy settings?',
          a: 'Go to Settings → Privacy: Show City on Profile (default: on), Show Email on Profile (default: off).'
        },
        {
          q: 'How do I manage email notification preferences?',
          a: 'Go to Settings → Notifications and toggle each type independently: Trade Proposals (On), Messages (On), Completed Trades (On), Wishlist Matches (On).'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, from Settings → Account. Deletion is permanent and removes all your data including listings and trade history. Resolve any active accepted trades before deleting.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <AlertCircle size={24} />,
      questions: [
        {
          q: 'I did not receive the verification email.',
          a: 'Check your Spam or Junk folder. Confirm the email address used during registration is correct. Wait up to 5 minutes — delivery can be delayed. Use "Resend Verification Email" on the verification error page or from Settings → Account.'
        },
        {
          q: 'I forgot my password.',
          a: 'Go to the Login page, click "Forgot Password", enter your registered email, and click the link in the email you receive. The link expires in 1 hour.'
        },
        {
          q: 'ISBN lookup returns "Book not found".',
          a: 'Check each digit against the barcode — one wrong digit returns no result. Enter the ISBN without hyphens or spaces and try again. Try the other format (ISBN-10 vs ISBN-13) if your copy shows both. Some regional, self-published, or very recent books are not indexed — fill in the form manually.'
        },
        {
          q: 'The cover image from ISBN lookup is not displaying.',
          a: 'Open Library cover images load from covers.openlibrary.org. If missing: Check your internet connection. Run the lookup again — the external service may have been briefly unavailable. Upload your own photo as a replacement.'
        },
        {
          q: 'My book images are not uploading.',
          a: 'Confirm the file is JPEG, PNG, or WebP and under 10 MB. Try a different browser or clear your browser cache. If the problem persists, contact support with details of the error shown.'
        },
        {
          q: 'I cannot find a specific book.',
          a: 'Try a shorter search term — partial words match. Search by author name instead of title. Remove any active genre filter — the book may be listed under a different genre. Clear all filters and browse the full catalogue. If the book is not listed yet, add it to your wishlist to be notified when it appears.'
        },
        {
          q: 'The website is not loading properly.',
          a: 'Refresh the page. Clear your browser cache and reload. Try a different browser. Confirm your internet connection is stable. If the problem persists, contact support.'
        },
        {
          q: '"Your session has expired" on the Google Complete Profile page.',
          a: 'The OAuth token in the URL timed out. Go back to the login page and sign in with Google again — the Complete Profile step will reappear.'
        },
        {
          q: 'The rating button is not showing after a trade.',
          a: 'Rating is only available when the trade status is "completed" and you have not already rated this trade. If the trade is still "accepted", click "Mark as Complete" first — but only after the physical exchange has happened.'
        },
        {
          q: '"Comment is required for ratings of 3 stars or lower."',
          a: 'A comment is mandatory for 1, 2, or 3 star ratings. Write a brief explanation of the issue and resubmit.'
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
    <div className="faq-page">
      <div className="faq-container">
        <div className="faq-header">
          <h1>
            <HelpCircle size={48} className="faq-icon" />
            Frequently Asked Questions
          </h1>
          <p className="intro-text">
            Common questions about using BookVerse. Find answers to account management, book trading, troubleshooting, and more.
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search frequently asked questions"
            />
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="quick-navigation">
          <h2>Jump to Section</h2>
          <div className="nav-grid">
            {faqData.map(section => (
              <a 
                key={section.id} 
                href={`#${section.id}`} 
                className="nav-card"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {section.icon}
                <span>{section.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="faq-sections">
          {filteredFaqData.length === 0 ? (
            <div className="no-results">
              <AlertCircle size={48} />
              <p>No results found for "{searchQuery}". Try different keywords or browse categories below.</p>
            </div>
          ) : (
            filteredFaqData.map(section => (
              <div key={section.id} id={section.id} className="faq-section">
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

        {/* Contact and Support Section */}
        <div className="contact-support-section">
          <div className="support-card">
            <Mail size={32} />
            <h2>Contact and Support</h2>
            <p>
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="support-details">
              <p><strong>How to contact us:</strong></p>
              <ul>
                <li>Navigate to <Link to="/contact">Help Center → Contact Support</Link> within the app</li>
                <li>Include your registered email or profile name</li>
                <li>Provide a description of the issue and screenshots if relevant</li>
              </ul>
              <p className="urgent-note">
                <strong>For urgent safety concerns:</strong> Contact your local emergency services directly — support cannot act as a substitute.
              </p>
            </div>
            <div className="support-actions">
              <Link to="/contact" className="contact-button">
                Contact Support
              </Link>
              <Link to="/help" className="help-button">
                Visit Help Center
              </Link>
            </div>
          </div>
        </div>

        {/* Related Resources */}
        <div className="related-resources">
          <h2>Related Documentation</h2>
          <div className="resources-grid">
            <Link to="/safety" className="resource-card">
              <Shield size={24} />
              <div>
                <h3>Safety Guide</h3>
                <p>Safe meetings, community guidelines, reporting</p>
              </div>
            </Link>
            <Link to="/terms" className="resource-card">
              <BookOpen size={24} />
              <div>
                <h3>Terms of Service</h3>
                <p>Platform rules and user agreements</p>
              </div>
            </Link>
            <Link to="/privacy" className="resource-card">
              <Shield size={24} />
              <div>
                <h3>Privacy Policy</h3>
                <p>How we protect your data</p>
              </div>
            </Link>
            <Link to="/about" className="resource-card">
              <Users size={24} />
              <div>
                <h3>About BookVerse</h3>
                <p>Learn more about our platform</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
