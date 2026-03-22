import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoginForm from '../components/LoginForm'

const LoginPage = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [errorShown, setErrorShown] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = searchParams.get('error')
    if (error && !errorShown) {
      setErrorShown(true)
      
      let errorMessage = 'Authentication failed. Please try again.'
      
      switch (error) {
        case 'auth_failed':
          errorMessage = 'Google authentication failed. Please try again or use email/password.'
          break
        case 'google_auth_failed':
          errorMessage = 'Unable to authenticate with Google. Please check your Google account and try again.'
          break
        default:
          errorMessage = 'Authentication failed. Please try again.'
      }
      
      toast.error(errorMessage)
      
      // Clean up URL by removing error parameter
      searchParams.delete('error')
      navigate({ search: searchParams.toString() }, { replace: true })
    }
  }, [searchParams, navigate, toast, errorShown])

  return <LoginForm />
}

export default LoginPage