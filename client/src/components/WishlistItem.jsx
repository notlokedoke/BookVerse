import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './WishlistItem.css';

const WishlistItem = ({ item, onRemove, isOwnProfile }) => {
  const { user } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRemoveClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmRemove = async () => {
    if (!item._id) {
      console.error('No item ID provided');
      return;
    }

    setIsRemoving(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${apiUrl}/api/wishlist/${item._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Call the onRemove callback to update the parent component
        if (onRemove) {
          onRemove(item._id);
        }
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      
      let errorMessage = 'Failed to remove book from wishlist. Please try again.';
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      // You could show this error in a toast or alert
      alert(errorMessage);
    } finally {
      setIsRemoving(false);
      setShowConfirmation(false);
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="wishlist-item">
      <div className="wishlist-item-content">
        <h3 className="wishlist-item-title">{item.title}</h3>
        {item.author && (
          <p className="wishlist-item-author">by {item.author}</p>
        )}
        {item.isbn && (
          <p className="wishlist-item-isbn">ISBN: {item.isbn}</p>
        )}
        {item.notes && (
          <p className="wishlist-item-notes">{item.notes}</p>
        )}
        <p className="wishlist-item-date">
          Added {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      {isOwnProfile && (
        <div className="wishlist-item-actions">
          {!showConfirmation ? (
            <button
              className="remove-btn"
              onClick={handleRemoveClick}
              disabled={isRemoving}
              title="Remove from wishlist"
            >
              ×
            </button>
          ) : (
            <div className="confirmation-dialog">
              <p className="confirmation-text">Remove this book?</p>
              <div className="confirmation-buttons">
                <button
                  className="confirm-btn"
                  onClick={handleConfirmRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? 'Removing...' : 'Yes'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={handleCancelRemove}
                  disabled={isRemoving}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistItem;