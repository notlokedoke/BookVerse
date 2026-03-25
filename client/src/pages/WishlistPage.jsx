import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Heart, Plus, Trash2, Search, BookOpen } from 'lucide-react';
import axios from 'axios';
import './WishlistPage.css';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'matches'
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchWishlist();
    fetchMatches();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching wishlist with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        setError('Please log in to view your wishlist');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Wishlist response:', response.data);
      setWishlistItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(error.response?.data?.error?.message || 'Failed to load wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/wishlist/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from your wishlist?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/wishlist/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Removed from wishlist');
      fetchWishlist();
      fetchMatches();
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      toast.error('Failed to remove item');
    }
  };

  const getMatchCount = (wishlistItemId) => {
    const match = matches.find(m => m.wishlistItem._id === wishlistItemId);
    return match ? match.matches.length : 0;
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page">
        <div className="empty-state">
          <h2>Error Loading Wishlist</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-add-wishlist-large">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {/* Header */}
        <div className="wishlist-header">
          <div className="header-content">
            <div className="header-icon">
              <Heart size={32} />
            </div>
            <div>
              <h1>My Wishlist</h1>
              <p className="header-subtitle">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'book' : 'books'} on your wishlist
              </p>
            </div>
          </div>
          <Link to="/wishlist/create" className="btn-add-wishlist">
            <Plus size={20} />
            Add Book
          </Link>
        </div>

        {/* Tabs */}
        <div className="wishlist-tabs">
          <button
            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <BookOpen size={18} />
            My Wishlist ({wishlistItems.length})
          </button>
          <button
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <Search size={18} />
            Matches ({matches.reduce((acc, m) => acc + m.matches.length, 0)})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'items' ? (
          wishlistItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Heart size={64} />
              </div>
              <h2>Your wishlist is empty</h2>
              <p>Start adding books you're looking for!</p>
              <Link to="/wishlist/create" className="btn-add-wishlist-large">
                <Plus size={20} />
                Add Your First Book
              </Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistItems.map((item) => {
                const matchCount = getMatchCount(item._id);
                const isFulfilled = !!item.fulfilledBy;
                return (
                  <div key={item._id} className={`wishlist-card ${isFulfilled ? 'fulfilled' : ''}`}>
                    {isFulfilled && (
                      <div className="fulfilled-badge">
                        ✓ Fulfilled
                      </div>
                    )}
                    {!isFulfilled && matchCount > 0 && (
                      <div className="match-badge">
                        {matchCount} {matchCount === 1 ? 'match' : 'matches'} found!
                      </div>
                    )}
                    
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="wishlist-cover"
                      />
                    )}
                    
                    <div className="wishlist-info">
                      <h3>{item.title}</h3>
                      {item.author && <p className="wishlist-author">by {item.author}</p>}
                      {item.isbn && <p className="wishlist-isbn">ISBN: {item.isbn}</p>}
                      
                      <div className="wishlist-actions">
                        {matchCount > 0 && (
                          <button
                            onClick={() => setActiveTab('matches')}
                            className="btn-view-matches"
                          >
                            View Matches
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="btn-delete"
                          title="Remove from wishlist"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Matches Tab
          matches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={64} />
              </div>
              <h2>No matches yet</h2>
              <p>We'll notify you when books matching your wishlist become available!</p>
            </div>
          ) : (
            <div className="matches-section">
              {matches.map((match, index) => (
                <div key={index} className="match-group">
                  <div className="match-header">
                    <h3>Looking for: {match.wishlistItem.title}</h3>
                    {match.wishlistItem.author && (
                      <p className="match-author">by {match.wishlistItem.author}</p>
                    )}
                    <span className="match-count">
                      {match.matches.length} available
                    </span>
                  </div>

                  <div className="matched-books-grid">
                    {match.matches.map((book) => (
                      <div key={book._id} className="matched-book-card">
                        <Link to={`/books/${book._id}`}>
                          <img 
                            src={book.imageUrl || '/placeholder-book.png'} 
                            alt={book.title}
                            className="book-cover"
                          />
                        </Link>
                        <div className="book-info">
                          <Link to={`/books/${book._id}`}>
                            <h4>{book.title}</h4>
                          </Link>
                          <p className="book-author">{book.author}</p>
                          <p className="book-condition">Condition: {book.condition}</p>
                          
                          {book.owner && (
                            <div className="book-owner">
                              <Link to={`/profile/${book.owner._id}`}>
                                <div className="owner-avatar">
                                  {book.owner.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span>{book.owner.name || 'Unknown'}</span>
                              </Link>
                            </div>
                          )}

                          <Link to={`/books/${book._id}`} className="btn-view-book">
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
