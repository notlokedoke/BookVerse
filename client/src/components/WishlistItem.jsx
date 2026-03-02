import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BookOpen, Trash2 } from 'lucide-react';
import '../components/BookCard.css'; // Inheriting book card styles for uniformity
import './WishlistItem.css';

const WishlistItem = ({ item, onRemove, isOwnProfile }) => {
  const { user } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirmRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item._id) return;

    // Simple confirm dialog instead of complex inline state for cleaner UI on cards
    if (!window.confirm(`Are you sure you want to remove "${item.title}" from your wishlist?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await axios.delete(`${apiUrl}/api/wishlist/${item._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success && onRemove) {
        onRemove(item._id);
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      alert('Failed to remove book from wishlist. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="book-card wishlist-card-uniform">
      {/* Book Image */}
      <div className="book-image-container">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={`${item.title} by ${item.author}`}
            className="book-image"
            onError={(e) => {
              e.target.src = '/placeholder-book.png';
            }}
          />
        ) : (
          <div className="missing-cover-uniform">
            <BookOpen size={40} className="missing-icon" />
          </div>
        )}

        <div className="condition-badge condition-like-new wishlist-badge">
          WANTED
        </div>
      </div>

      {/* Book Details */}
      <div className="book-details">
        <h3 className="book-title" title={item.title}>
          {item.title}
        </h3>
        {item.author && (
          <p className="book-author" title={item.author}>
            by {item.author}
          </p>
        )}
        <div className="book-meta mt-1">
          {item.isbn && (
            <span className="book-genre" title="ISBN">
              ISBN: {item.isbn}
            </span>
          )}
          {item.createdAt && (
            <span className="book-date">Added {formatDate(item.createdAt)}</span>
          )}
        </div>
        {item.notes && (
          <div className="wishlist-notes-inline">
            <p>"{item.notes}"</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isOwnProfile && (
        <div className="book-actions">
          <button
            className="delete-btn full-width-btn"
            onClick={handleConfirmRemove}
            disabled={isRemoving}
            title="Remove from wishlist"
          >
            <Trash2 size={16} />
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WishlistItem;