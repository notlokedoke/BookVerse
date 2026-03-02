import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import './WishlistMatchesPage.css';

const WishlistMatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchMatches();
    backfillImages();
  }, []);

  const backfillImages = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/wishlist/backfill-images', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Silently succeed - this is a background operation
    } catch (error) {
      // Silently fail - this is optional
      console.log('Image backfill skipped:', error.message);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/wishlist/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load wishlist matches');
    } finally {
      setLoading(false);
    }
  };

  const getMatchBadge = (matchType, matchScore) => {
    if (matchType === 'exact') {
      return <span className="match-badge exact">Perfect Match</span>;
    } else if (matchType === 'strong') {
      return <span className="match-badge strong">Strong Match</span>;
    } else {
      return <span className="match-badge fuzzy">{matchScore}% Match</span>;
    }
  };

  if (loading) {
    return (
      <div className="wishlist-matches-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="wishlist-matches-container">
        <div className="empty-state">
          <div className="empty-icon">💫</div>
          <h2>No Matches Found</h2>
          <p>We couldn't find any books matching your wishlist yet.</p>
          <p className="empty-hint">Try adding more books to your wishlist or check back later!</p>
          <Link to="/wishlist/create" className="btn-add-wishlist">
            Add to Wishlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-matches-container">
      <div className="page-header">
        <h1>Wishlist Matches</h1>
        <p className="page-subtitle">
          Found {matches.length} book{matches.length !== 1 ? 's' : ''} from your wishlist
        </p>
      </div>

      <div className="matches-list">
        {matches.map((match, index) => (
          <div key={index} className="match-group">
            <div className="wishlist-item-header">
              <h3>Looking for: {match.wishlistItem.title}</h3>
              {match.wishlistItem.author && (
                <p className="wishlist-author">by {match.wishlistItem.author}</p>
              )}
              <span className="match-count">
                {match.matches.length} available {match.matches.length === 1 ? 'copy' : 'copies'}
              </span>
            </div>

            <div className="matched-books-grid">
              {match.matches.map((book) => (
                <div key={book._id} className="matched-book-card">
                  {getMatchBadge(book.matchType, book.matchScore)}
                  
                  <Link to={`/browse?bookId=${book._id}`} className="book-link">
                    <img 
                      src={book.imageUrl || '/placeholder-book.png'} 
                      alt={book.title}
                      className="book-cover"
                    />
                  </Link>

                  <div className="book-info">
                    <Link to={`/browse?bookId=${book._id}`} className="book-title-link">
                      <h4>{book.title}</h4>
                    </Link>
                    <p className="book-author">{book.author}</p>
                    <p className="book-condition">Condition: {book.condition}</p>
                    
                    <div className="book-owner-info">
                      <Link to={`/profile/${book.owner._id}`} className="owner-link">
                        <div className="owner-avatar">
                          {book.owner.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="owner-name">{book.owner.name}</p>
                          {book.owner.city && book.owner.privacySettings?.showCity !== false && (
                            <p className="owner-location">📍 {book.owner.city}</p>
                          )}
                        </div>
                      </Link>
                    </div>

                    <Link 
                      to={`/browse?bookId=${book._id}`}
                      className="btn-view-book"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistMatchesPage;
