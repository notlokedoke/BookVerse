import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'

// Mock the useAuth hook
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn()
  }
})

import { useAuth } from '../context/AuthContext'

describe('ProtectedRoute', () => {
  it('shows loading state while authentication is loading', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Loading...')).toBeDefined()
  })

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Protected Content')).toBeDefined()
  })

  it('redirects to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    })

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    )

    expect(screen.getByText('Login Page')).toBeDefined()
  })
})
