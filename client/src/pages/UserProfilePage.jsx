import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import RatingDisplay from '../components/RatingDisplay';
import RatingCard from '../components/RatingCard';
import BookCard from '../components/BookCard';
import { MapPin, Calendar, Star, MessageCircle, BookOpen, Award } from 'lucide-react';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userBooks, setUserBooks] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('books');

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

      // Fetch ratings
      const ratingsRes = await axios.get(`/api/ratings/user/${targetUserId}`);
      setRatings(ratingsRes.data.data || []);

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

  const memberSince = new Date(profileUser.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        {/* Hero Section */}
        <div className="profile-hero">
          <div className="profile-hero-content">
            <div className="profile-avatar-hero">
              {profileUser.name?.charAt(0).toUpperCase()}
            </div>
            
            <div className="hero-info">
              <h1 className="profile-name">{profileUser.name}</h1>
              
              <div className="profile-meta-row">
                {profileUser.city && profileUser.privacySettings?.showCity !== false && (
                  <span className="meta-badge">
                    <MapPin size={16} />
                    {profileUser.city}
                  </span>
                )}
                <span className="meta-badge">
                  <Calendar size={16} />
                  Member since {memberSince}
                </span>
              </div>

              <div className="profile-rating-hero">
                <RatingDisplay 
                  averageRating={profileUser.averageRating || 0} 
                  ratingCount={profileUser.ratingCount || 0}
                  size="lg"
                />
              </div>
            </div>

            {isOwnProfile && (
              <Link to="/profile/settings" className="btn-edit-profile">
                Edit Profile
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <BookOpen size={24} />
              <div className="stat-content">
                <span className="stat-value">{userBooks.length}</span>
                <span className="stat-label">Books Listed</span>
              </div>
            </div>
            <div className="stat-card">
              <Award size={24} />
              <div className="stat-content">
                <span className="stat-value">{profileUser.completedTrades || 0}</span>
                <span className="stat-label">Trades Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <Star size={24} />
              <div className="stat-content">
                <span className="stat-value">{profileUser.ratingCount || 0}</span>
                <span className="stat-label">Reviews</span>
              </div>
            </div>
            <div className="stat-card">
              <MessageCircle size={24} />
              <div className="stat-content">
                <span className="stat-value">95%</span>
                <span className="stat-label">Response Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            {profileUser.bio && (
              <div className="sidebar-card">
                <h3>About</h3>
                <p className="bio-text">{profileUser.bio}</p>
              </div>
            )}

            <div className="sidebar-card">
              <h3>Trading Preferences</h3>
              <div className="preference-list">
                <div className="preference-item">
                  <span className="preference-label">Preferred Genres</span>
                  <span className="preference-value">Fiction, Mystery</span>
                </div>
                <div className="preference-item">
                  <span className="preference-label">Condition Standards</span>
                  <span className="preference-value">Good or better</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <button className="btn-contact">
                <MessageCircle size={18} />
                Contact User
              </button>
            )}
          </aside>

          {/* Main Content */}
          <main className="profile-main">
            {/* Tabs */}
            <div className="profile-tabs">
              <button 
                className={`tab-button ${activeTab === 'books' ? 'active' : ''}`}
                onClick={() => setActiveTab('books')}
              >
                Available Books ({userBooks.length})
              </button>
              <button 
                className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({ratings.length})
              </button>
              {isOwnProfile && (
                <button 
                  className={`tab-button ${activeTab === 'wishlist' ? 'active' : ''}`}
                  onClick={() => setActiveTab('wishlist')}
                >
                  Wishlist ({wishlist.length})
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'books' && (
                <div className="books-section">
                  {userBooks.length > 0 ? (
                    <div className="books-grid-modern">
                      {userBooks.map(book => (
                        <BookCard key={book._id} book={book} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-modern">
                      <BookOpen size={48} />
                      <h3>No books listed yet</h3>
                      <p>{isOwnProfile ? 'Start building your library by adding your first book' : 'This user hasn\'t listed any books yet'}</p>
                      {isOwnProfile && (
                        <Link to="/books/create" className="btn-primary-modern">
                          Add Your First Book
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="reviews-section">
                  {ratings.length > 0 ? (
                    <div className="ratings-list-modern">
                      {ratings.map(rating => (
                        <RatingCard key={rating._id} rating={rating} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-modern">
                      <Star size={48} />
                      <h3>No reviews yet</h3>
                      <p>Reviews from completed trades will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && isOwnProfile && (
                <div className="wishlist-section">
                  {wishlist.length > 0 ? (
                    <div className="wishlist-grid-modern">
                      {wishlist.map(item => (
                        <div key={item._id} className="wishlist-card">
                          <h4>{item.title}</h4>
                          {item.author && <p className="wishlist-author">{item.author}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-modern">
                      <BookOpen size={48} />
                      <h3>Your wishlist is empty</h3>
                      <p>Add books you're looking for to help others find matches</p>
                      <Link to="/wishlist/create" className="btn-primary-modern">
                        Add to Wishlist
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
