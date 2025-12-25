import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './WishlistSection.css';

const WishlistSection = ({ userId, isOwnProfile }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        setError('');
        
        const targetUserId = userId || user?._id;
        if (!targetUserId) {
          setError('User ID not found');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/wishlist/user/${targetUserId}`);
        
        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data.data || []);
        } else {
          const errorData = await response.json();
          setError(errorData.error?.message || 'Failed to load wishlist');
        }
      } catch (err) {
        console.error('Wishlist fetch error:', err);
        setError('An error occurred while loading the wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="wishlist-section">
        <h2 className="text-xl font-semibold mb-4">
          {isOwnProfile ? 'My Wishlist' : 'Wishlist'}
        </h2>
        <div className="wishlist-loading">
          <p>Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-section">
        <h2 className="text-xl font-semibold mb-4">
          {isOwnProfile ? 'My Wishlist' : 'Wishlist'}
        </h2>
        <div className="wishlist-error">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {isOwnProfile ? 'My Wishlist' : 'Wishlist'}
        </h2>
        {isOwnProfile && (
          <a
            href="/wishlist/create"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            + Add Book
          </a>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="wishlist-empty">
          <p className="text-gray-600">
            {isOwnProfile 
              ? "You haven't added any books to your wishlist yet. Add books you're looking for to help other users find potential trades!"
              : "This user hasn't added any books to their wishlist yet."
            }
          </p>
          {isOwnProfile && (
            <a
              href="/wishlist/create"
              className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Add Your First Book
            </a>
          )}
        </div>
      ) : (
        <div className="wishlist-items">
          {wishlistItems.map((item) => (
            <div key={item._id} className="wishlist-item">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistSection;