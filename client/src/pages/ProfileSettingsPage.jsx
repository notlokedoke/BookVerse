import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import PrivacyToggle from '../components/PrivacyToggle'
import './ProfileSettingsPage.css'

const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    privacySettings: {
      showCity: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        city: user.city || '',
        privacySettings: {
          showCity: user.privacySettings?.showCity !== false
        }
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePrivacyChange = (showCity) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        showCity
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Profile updated successfully!')
        updateUser(data.data)
      } else {
        setError(data.error?.message || 'Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred while updating your profile')
      console.error('Profile update error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-settings-page">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Profile Settings</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>

              {/* City Field */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your city"
                />
              </div>

              {/* Privacy Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Settings
                </label>
                <div className="bg-gray-50 p-4 rounded-md">
                  <PrivacyToggle
                    showCity={formData.privacySettings.showCity}
                    onChange={handlePrivacyChange}
                  />
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <a
                  href="/profile"
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettingsPage