import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import './WishlistButton.css';

const WishlistButton = ({ book, compact = false, showLabel = true }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated && book?._id) {
      checkWishlistStatus();
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, book?._id]);

  const checkWishlistStatus = async () => {
    try {
      setChecking(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/wishlist/check/${book._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIsInWishlist(response.data.data.inWishlist);
        setWishlistItemId(response.data.data.wishlistItem?._id || null);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to add books to your wishlist');
      return;
    }

    // Check if user owns this book
    if (user && book.owner && user._id === book.owner._id) {
      toast.info('You cannot add your own book to your wishlist');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (isInWishlist && wishlistItemId) {
        // Remove from wishlist
        await axios.delete(`/api/wishlist/${wishlistItemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsInWishlist(false);
        setWishlistItemId(null);
        toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        const response = await axios.post('/api/wishlist', {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          imageUrl: book.imageUrl,
          sourceBook: book._id,
          priority: 3
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setIsInWishlist(true);
          setWishlistItemId(response.data.data._id);
          toast.success('Added to wishlist!');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      if (error.response?.status === 409) {
        toast.info('This book is already in your wishlist');
        // Refresh status
        checkWishlistStatus();
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to update wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Check if user owns this book
  const isOwner = user && book.owner && user._id === book.owner._id;
  if (isOwner) {
    return null;
  }

  if (checking) {
    return (
      <button className={`wishlist-button ${compact ? 'compact' : ''} checking`} disabled>
        <Heart size={compact ? 16 : 20} />
        {showLabel && !compact && <span>...</span>}
      </button>
    );
  }

  return (
    <button
      className={`wishlist-button ${compact ? 'compact' : ''} ${isInWishlist ? 'active' : ''}`}
      onClick={handleToggleWishlist}
      disabled={loading}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        size={compact ? 16 : 20} 
        fill={isInWishlist ? 'currentColor' : 'none'}
      />
      {showLabel && !compact && (
        <span>{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
      )}
    </button>
  );
};

export default WishlistButton;
