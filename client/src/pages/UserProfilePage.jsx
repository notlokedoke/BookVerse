import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './UserProfilePage.css'

const UserProfilePage = () => {
  const { userId } = useParams()
  const { user } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = !userId || userId === user?._id

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const targetUserId = userId || user?._id
        
        if (!targetUserId) {
          setError('User not found')
          return
        }

        const response = await fetch(`/api/users/${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setProfileUser(data.data)
        } else {
          setError('Failed to load user profile')
        }
      } catch (err) {
        setError('An error occurred while loading the profile')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserProfile()
    }
  }, [userId, user])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-profile-page">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profileUser.name}</h1>
                {profileUser.city && (
                  <p className="text-gray-600 mt-1">📍 {profileUser.city}</p>
                )}
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="ml-1 text-gray-700">
                      {profileUser.averageRating > 0 
                        ? `${profileUser.averageRating.toFixed(1)} (${profileUser.ratingCount} reviews)`
                        : 'No reviews yet'
                      }
                    </span>
                  </div>
                </div>
              </div>
              {isOwnProfile && (
                <div className="flex gap-3">
                  <a
                    href="/books/create"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Create Book Listing
                  </a>
                  <a
                    href="/profile/settings"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Book Listings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {isOwnProfile ? 'My Books' : `${profileUser.name}'s Books`}
                </h2>
                {isOwnProfile && (
                  <a
                    href="/books/create"
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    + Add Book
                  </a>
                )}
              </div>
              <div className="text-gray-600">
                <p>Book listings will be displayed here once the book management system is implemented.</p>
              </div>
            </div>

            {/* Wishlist */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isOwnProfile ? 'My Wishlist' : 'Wishlist'}
              </h2>
              <div className="text-gray-600">
                <p>Wishlist items will be displayed here once the wishlist system is implemented.</p>
              </div>
            </div>
          </div>

          {/* Ratings Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <div className="text-gray-600">
              <p>User reviews will be displayed here once the rating system is implemented.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage