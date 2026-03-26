import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Heart, Plus, Trash2, Search, BookOpen } from 'lucide-react';
import axios from 'axios';
import './WishlistPage.css';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Add effect to refetch when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      fetchWishlist();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
      console.log('Wishlist items count:', response.data.data?.length);
      console.log('Wishlist items:', response.data.data);
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
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
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
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      toast.error('Failed to remove item');
    }
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
            <span className="btn-icon">+</span>
            <span className="btn-text">Add Book</span>
          </Link>
        </div>

        {/* Content */}
        {wishlistItems.length === 0 ? (
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
                const isFulfilled = !!item.fulfilledBy;
                return (
                  <div key={item._id} className={`wishlist-card ${isFulfilled ? 'fulfilled' : ''}`}>
                    {isFulfilled && (
                      <div className="fulfilled-badge">
                        ✓ Fulfilled
                      </div>
                    )}
                    
                    <div className="wishlist-image-container">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="wishlist-cover"
                        />
                      ) : (
                        <img 
                          src="/placeholder-book.svg" 
                          alt={item.title}
                          className="wishlist-cover"
                        />
                      )}
                    </div>
                    
                    <div className="wishlist-info">
                      <h3>{item.title}</h3>
                      {item.author && <p className="wishlist-author">by {item.author}</p>}
                    </div>
                    
                    <div className="wishlist-actions">
                      <Link
                        to="/wishlist/matches"
                        className="btn-view-matches"
                      >
                        View Matches
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="btn-delete"
                        title="Remove from wishlist"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default WishlistPage;
