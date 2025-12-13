import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './ProfileSettingsPage.css'

const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    city: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        city: user.city || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous messages
    setErrors({})
    setSuccessMessage('')
    
    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    // Check if anything actually changed
    if (formData.name === user.name && formData.city === user.city) {
      setSuccessMessage('No changes to save')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`,
        {
          name: formData.name.trim(),
          city: formData.city.trim()
        }
      )
      
      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!')
        
        // Update the user context with new data
        updateUser(response.data.data)
        
        // Optionally redirect back to profile after a delay
        setTimeout(() => {
          navigate('/profile')
        }, 2000)
      }
    } catch (error) {
      console.error('Profile update error:', error)
      
      if (error.response?.data?.error) {
        const serverError = error.response.data.error
        
        // Handle validation errors from server
        if (serverError.code === 'VALIDATION_ERROR' && serverError.details) {
          const fieldErrors = {}
          if (Array.isArray(serverError.details)) {
            serverError.details.forEach(detail => {
              if (detail.path) {
                fieldErrors[detail.path] = detail.msg || detail.message
              }
            })
          }
          setErrors(fieldErrors)
        } else {
          // Handle other server errors
          setErrors({ 
            general: serverError.message || 'Failed to update profile' 
          })
        }
      } else {
        // Handle network errors
        setErrors({ 
          general: 'Network error. Please check your connection and try again.' 
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/profile')
  }

  if (!user) {
    return (
      <div className="settings-container">
        <div className="settings-error">
          <h2>Access Denied</h2>
          <p>You must be logged in to access profile settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Profile Settings</h1>
        <p>Update your profile information</p>
      </div>

      <div className="settings-content">
        <form onSubmit={handleSubmit} className="settings-form">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}
          
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {errors.name && (
              <div className="error-message field-error">
                {errors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="city" className="form-label">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`form-input ${errors.city ? 'error' : ''}`}
              placeholder="Enter your city"
              disabled={loading}
            />
            {errors.city && (
              <div className="error-message field-error">
                {errors.city}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileSettingsPage