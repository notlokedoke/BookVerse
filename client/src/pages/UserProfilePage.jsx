import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './UserProfilePage.css'

const UserProfilePage = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // If no userId in params, show current user's profile
  const targetUserId = userId || currentUser?._id

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        let response
        if (!userId && currentUser) {
          // Fetch current user's own profile
          response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`)
        } else if (targetUserId) {
          // Fetch specific user's profile (this endpoint doesn't exist yet, but we'll prepare for it)
          response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${targetUserId}`)
        } else {
          throw new Error('No user ID available')
        }

        setProfileUser(response.data.data)
      } catch (err) {
        console.error('Failed to fetch user profile:', err)
        setError(err.response?.data?.error?.message || 'Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    if (targetUserId) {
      fetchUserProfile()
    }
  }, [targetUserId, userId, currentUser])

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>User Not Found</h2>
          <p>The requested user profile could not be found.</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser && profileUser._id === currentUser._id

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {profileUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{profileUser.name}</h1>
            <div className="profile-meta">
              {profileUser.privacySettings?.showCity !== false && profileUser.city && (
                <span className="profile-city">📍 {profileUser.city}</span>
              )}
              <div className="profile-rating">
                <span className="rating-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span 
                      key={i} 
                      className={`star ${i < Math.round(profileUser.averageRating || 0) ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span className="rating-text">
                  {profileUser.averageRating ? profileUser.averageRating.toFixed(1) : '0.0'} 
                  ({profileUser.ratingCount || 0} {profileUser.ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            </div>
          </div>
        </div>
        {isOwnProfile && (
          <div className="profile-actions">
            <button className="edit-profile-btn">Edit Profile</button>
          </div>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2 className="section-title">Book Listings</h2>
          <div className="section-placeholder">
            <div className="placeholder-icon">📚</div>
            <p className="placeholder-text">
              {isOwnProfile 
                ? "Your book listings will appear here once you start adding books to trade."
                : `${profileUser.name}'s book listings will appear here.`
              }
            </p>
            {isOwnProfile && (
              <button className="placeholder-action-btn">Add Your First Book</button>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Wishlist</h2>
          <div className="section-placeholder">
            <div className="placeholder-icon">💭</div>
            <p className="placeholder-text">
              {isOwnProfile 
                ? "Books you're looking for will appear here when you add them to your wishlist."
                : `${profileUser.name}'s wishlist will appear here.`
              }
            </p>
            {isOwnProfile && (
              <button className="placeholder-action-btn">Add to Wishlist</button>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Ratings & Reviews</h2>
          <div className="section-placeholder">
            <div className="placeholder-icon">⭐</div>
            <p className="placeholder-text">
              {isOwnProfile 
                ? "Ratings and reviews from your completed trades will appear here."
                : `Ratings and reviews for ${profileUser.name} will appear here.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage