import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Navbar from './Navbar'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock AuthContext
const mockLogout = vi.fn()
let mockAuthState = {
  user: null,
  isAuthenticated: false,
  logout: mockLogout,
  loading: false
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState
}))

const renderNavbar = (authProps = {}) => {
  mockAuthState = {
    user: null,
    isAuthenticated: false,
    logout: mockLogout,
    loading: false,
    ...authProps
  }
  
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders BookVerse brand link', () => {
    renderNavbar()
    expect(screen.getByText('BookVerse')).toBeInTheDocument()
    expect(screen.getByText('BookVerse').closest('a')).toHaveAttribute('href', '/')
  })

  it('shows login and register links when not authenticated', () => {
    renderNavbar({ isAuthenticated: false })
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })

  it('shows user greeting and logout button when authenticated', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' }
    renderNavbar({ isAuthenticated: true, user: mockUser })
    
    expect(screen.getByText('Hello, John Doe!')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
    expect(screen.queryByText('Register')).not.toBeInTheDocument()
  })

  it('calls logout and navigates to homepage when logout button is clicked', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' }
    renderNavbar({ isAuthenticated: true, user: mockUser })
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('has correct navigation links', () => {
    renderNavbar({ isAuthenticated: false })
    
    const browseLink = screen.getByText('Browse').closest('a')
    const loginLink = screen.getByText('Login').closest('a')
    const registerLink = screen.getByText('Register').closest('a')
    
    expect(browseLink).toHaveAttribute('href', '/browse')
    expect(loginLink).toHaveAttribute('href', '/login')
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('shows dashboard link when authenticated', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' }
    renderNavbar({ isAuthenticated: true, user: mockUser })
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })
})