import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import axios from 'axios'
import ProfileSettingsPage from './ProfileSettingsPage'
import { AuthProvider } from '../context/AuthContext'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock user data
const mockUser = {
  _id: '507f191e810c19729de860ea',
  name: 'John Doe',
  email: 'john@example.com',
  city: 'New York',
  privacySettings: { showCity: true },
  averageRating: 4.5,
  ratingCount: 10
}

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  }
})

// Helper function to render component with auth context
const renderWithAuth = (user = mockUser, updateUser = vi.fn()) => {
  mockUseAuth.mockReturnValue({
    user,
    token: 'mock-token',
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser,
    isAuthenticated: !!user
  })

  return render(
    <BrowserRouter>
      <ProfileSettingsPage />
    </BrowserRouter>
  )
}

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders profile settings form with user data', () => {
    renderWithAuth()

    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Update your profile information')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('shows access denied when user is not logged in', () => {
    renderWithAuth(null)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You must be logged in to access profile settings.')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderWithAuth()

    // Clear the name field
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: '' } })

    // Clear the city field
    const cityInput = screen.getByDisplayValue('New York')
    fireEvent.change(cityInput, { target: { value: '' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('City is required')).toBeInTheDocument()
    })
  })

  it('shows no changes message when data is unchanged', async () => {
    renderWithAuth()

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('No changes to save')).toBeInTheDocument()
    })
  })

  it('successfully updates profile', async () => {
    const mockUpdateUser = vi.fn()

    mockedAxios.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...mockUser,
          name: 'Jane Doe',
          city: 'Los Angeles'
        }
      }
    })

    renderWithAuth(mockUser, mockUpdateUser)

    // Update name
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    // Update city
    const cityInput = screen.getByDisplayValue('New York')
    fireEvent.change(cityInput, { target: { value: 'Los Angeles' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })

    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/profile',
      {
        name: 'Jane Doe',
        city: 'Los Angeles',
        privacySettings: {
          showCity: true
        }
      }
    )

    expect(mockUpdateUser).toHaveBeenCalledWith({
      ...mockUser,
      name: 'Jane Doe',
      city: 'Los Angeles'
    })

    // Should redirect after 2 seconds
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    }, { timeout: 2500 })
  })

  it('handles server validation errors', async () => {
    mockedAxios.put.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              { path: 'name', msg: 'Name is too short' }
            ]
          }
        }
      }
    })

    renderWithAuth()

    // Update name
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name is too short')).toBeInTheDocument()
    })
  })

  it('handles network errors', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Network Error'))

    renderWithAuth()

    // Update name
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
    })
  })

  it('navigates back to profile when cancel is clicked', () => {
    renderWithAuth()

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('clears field errors when user starts typing', async () => {
    renderWithAuth()

    // Clear the name field to trigger validation error
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: '' } })

    // Submit to show error
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    // Start typing to clear error
    fireEvent.change(nameInput, { target: { value: 'J' } })

    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })
  })

  it('shows loading state during form submission', async () => {
    // Mock a delayed response
    mockedAxios.put.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        data: { success: true, data: mockUser }
      }), 100))
    )

    renderWithAuth()

    // Update name
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })

  it('renders privacy toggle and handles changes', async () => {
    const mockUpdateUser = vi.fn()

    mockedAxios.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...mockUser,
          privacySettings: { showCity: false }
        }
      }
    })

    renderWithAuth(mockUser, mockUpdateUser)

    // Check that privacy toggle is rendered
    expect(screen.getByText('Show city on profile')).toBeInTheDocument()
    expect(screen.getByText('When enabled, other users can see your city information on your profile and in book listings')).toBeInTheDocument()
    
    // Check initial state
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Visible')).toBeInTheDocument()

    // Click the toggle
    fireEvent.click(toggle)

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })

    // Check that API was called with privacy settings
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/profile',
      {
        name: 'John Doe',
        city: 'New York',
        privacySettings: {
          showCity: false
        }
      }
    )
  })
})