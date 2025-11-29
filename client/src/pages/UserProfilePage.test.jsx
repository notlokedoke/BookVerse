import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import axios from 'axios'
import UserProfilePage from './UserProfilePage'
import { AuthProvider } from '../context/AuthContext'

// Mock axios
vi.mock('axios')

// Mock useParams
const mockUseParams = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams()
  }
})

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  }
})

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({})
    mockUseAuth.mockReturnValue({
      user: { _id: '123', name: 'Current User' },
      loading: false,
      isAuthenticated: true
    })
  })

  it('shows loading state initially', () => {
    // Mock the axios call to never resolve
    axios.get.mockImplementation(() => new Promise(() => {}))
    
    renderWithProviders(<UserProfilePage />)
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('displays user profile information when loaded', async () => {
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      city: 'New York',
      averageRating: 4.5,
      ratingCount: 10,
      privacySettings: { showCity: true }
    }

    axios.get.mockResolvedValueOnce({
      data: { data: mockUser }
    })

    renderWithProviders(<UserProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(screen.getByText('📍 New York')).toBeInTheDocument()
    // Check for rating elements
    expect(screen.getByText(/4\.5/)).toBeInTheDocument()
    expect(screen.getByText(/10.*ratings/)).toBeInTheDocument()
    expect(screen.getByText('Book Listings')).toBeInTheDocument()
    expect(screen.getByText('Wishlist')).toBeInTheDocument()
    expect(screen.getByText('Ratings & Reviews')).toBeInTheDocument()
  })

  it('hides city when privacy setting is disabled', async () => {
    const mockUser = {
      _id: '123',
      name: 'Jane Doe',
      city: 'Los Angeles',
      averageRating: 3.2,
      ratingCount: 5,
      privacySettings: { showCity: false }
    }

    axios.get.mockResolvedValueOnce({
      data: { data: mockUser }
    })

    renderWithProviders(<UserProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    expect(screen.queryByText('📍 Los Angeles')).not.toBeInTheDocument()
    // Check for rating elements
    expect(screen.getByText(/3\.2/)).toBeInTheDocument()
    expect(screen.getByText(/5.*ratings/)).toBeInTheDocument()
  })

  it('displays error state when API call fails', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'User not found'
          }
        }
      }
    })

    renderWithProviders(<UserProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Profile')).toBeInTheDocument()
    })

    expect(screen.getByText('User not found')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('shows placeholder sections with appropriate messages', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      city: 'Test City',
      averageRating: 0,
      ratingCount: 0,
      privacySettings: { showCity: true }
    }

    axios.get.mockResolvedValueOnce({
      data: { data: mockUser }
    })

    renderWithProviders(<UserProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    // Check placeholder messages
    expect(screen.getByText(/Your book listings will appear here/)).toBeInTheDocument()
    expect(screen.getByText(/Books you're looking for will appear here/)).toBeInTheDocument()
    expect(screen.getByText(/Ratings and reviews from your completed trades/)).toBeInTheDocument()
    
    // Check action buttons for own profile
    expect(screen.getByText('Add Your First Book')).toBeInTheDocument()
    expect(screen.getByText('Add to Wishlist')).toBeInTheDocument()
  })

  it('displays different messages for other users profiles', async () => {
    // Mock viewing another user's profile
    mockUseParams.mockReturnValue({ userId: '456' })
    
    const mockUser = {
      _id: '456',
      name: 'Other User',
      city: 'Other City',
      averageRating: 2.5,
      ratingCount: 3,
      privacySettings: { showCity: true }
    }

    axios.get.mockResolvedValueOnce({
      data: { data: mockUser }
    })

    renderWithProviders(<UserProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })

    // Check placeholder messages for other user's profile
    expect(screen.getByText(/Other User's book listings will appear here/)).toBeInTheDocument()
    expect(screen.getByText(/Other User's wishlist will appear here/)).toBeInTheDocument()
    expect(screen.getByText(/Ratings and reviews for Other User/)).toBeInTheDocument()
    
    // Should not show action buttons for other user's profile
    expect(screen.queryByText('Add Your First Book')).not.toBeInTheDocument()
    expect(screen.queryByText('Add to Wishlist')).not.toBeInTheDocument()
  })
})