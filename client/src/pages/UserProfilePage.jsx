import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userBooks, setUserBooks] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === user?._id;
  const targetUserId = userId || user?._id;

  useEffect(() => {
    fetchProfileData();
  }, [targetUserId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Fetch user profile
      const userRes = await axios.get(`/api/users/${targetUserId}`, config);
      setProfileUser(userRes.data.data);

      // Fetch user's books
      const booksRes = await axios.get(`/api/books/user/${targetUserId}`);
      setUserBooks(booksRes.data.data?.books || []);

      // Fetch wishlist
      const wishlistRes = await axios.get(`/api/wishlist/user/${targetUserId}`);
      setWishlist(wishlistRes.data.data || []);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-error">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profileUser.name?.charAt(0).toUpperCase()}
        </div>
        <h1 className="profile-name">{profileUser.name}</h1>
        
        <div className="profile-meta">
          {profileUser.city && profileUser.privacySettings?.showCity !== false && (
            <span className="meta-item">📍 {profileUser.city}</span>
          )}
          <span className="meta-item">
            ⭐ {profileUser.averageRating > 0 
              ? `${profileUser.averageRating.toFixed(1)} (${profileUser.ratingCount})`
              : 'No ratings yet'
            }
          </span>
        </div>

        {isOwnProfile && (
          <Link to="/profile/settings" className="btn-edit">
            Edit Profile
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-value">{userBooks.length}</span>
          <span className="stat-label">Books</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{wishlist.length}</span>
          <span className="stat-label">Wishlist</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{profileUser.ratingCount || 0}</span>
          <span className="stat-label">Reviews</span>
        </div>
      </div>

      {/* Books Section */}
      <section className="profile-section">
        <div className="section-header">
          <h2>Books</h2>
          {isOwnProfile && (
            <Link to="/books/create" className="btn-add">+ Add Book</Link>
          )}
        </div>

        {userBooks.length > 0 ? (
          <div className="books-grid">
            {userBooks.slice(0, 6).map(book => (
              <Link key={book._id} to={`/browse?bookId=${book._id}`} className="book-card">
                <img src={book.imageUrl} alt={book.title} className="book-cover" />
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{isOwnProfile ? 'You haven\'t added any books yet' : 'No books listed'}</p>
            {isOwnProfile && (
              <Link to="/books/create" className="btn-primary">Add Your First Book</Link>
            )}
          </div>
        )}

        {userBooks.length > 6 && (
          <Link to="/my-books" className="btn-view-all">View All Books →</Link>
        )}
      </section>

      {/* Wishlist Section */}
      <section className="profile-section">
        <div className="section-header">
          <h2>Wishlist</h2>
          {isOwnProfile && (
            <Link to="/wishlist/create" className="btn-add">+ Add Book</Link>
          )}
        </div>

        {wishlist.length > 0 ? (
          <div className="wishlist-grid">
            {wishlist.slice(0, 4).map(item => (
              <div key={item._id} className="wishlist-item">
                <h3>{item.title}</h3>
                {item.author && <p>{item.author}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{isOwnProfile ? 'Your wishlist is empty' : 'No wishlist items'}</p>
            {isOwnProfile && (
              <Link to="/wishlist/create" className="btn-primary">Add to Wishlist</Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserProfilePage;
