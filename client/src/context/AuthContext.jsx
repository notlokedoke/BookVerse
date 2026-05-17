import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Set axios default authorization header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [token])

  // Load user data on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
          const response = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`)
          setUser(response.data.data)
          setToken(storedToken)
        } catch (error) {
          console.error('Failed to load user:', error)
          // Clear invalid token
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || ''}/api/auth/login`,
        { email, password }
      )
      
      const { token: newToken, user: userData } = response.data.data
      setToken(newToken)
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        }
      }
      
      // Handle server errors
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Login failed. Please try again.'
      }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData)
  }, [])

  // Memoize the context value so consumers only re-render when something
  // they actually depend on changes, not on every AuthProvider render.
  const value = useMemo(() => ({
    user,
    setUser,
    token,
    setToken,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }), [user, token, loading, login, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
