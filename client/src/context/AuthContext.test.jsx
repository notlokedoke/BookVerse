import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
  default: {
    defaults: {
      headers: {
        common: {}
      }
    },
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
    delete axios.defaults.headers.common['Authorization']
  })

  it('provides authentication context', () => {
    const TestComponent = () => {
      const auth = useAuth()
      return <div>{auth ? 'Context Available' : 'No Context'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Context Available')).toBeDefined()
  })

  it('initializes with no user when no token in localStorage', async () => {
    const TestComponent = () => {
      const { user, loading } = useAuth()
      if (loading) return <div>Loading...</div>
      return <div>{user ? 'User Logged In' : 'No User'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('No User')).toBeDefined()
    })
  })

  it('stores token in localStorage on login', async () => {
    const mockToken = 'test-token-123'
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
    
    axios.post.mockResolvedValue({
      data: {
        data: {
          token: mockToken,
          user: mockUser
        }
      }
    })

    const TestComponent = () => {
      const { login, user } = useAuth()
      
      const handleLogin = async () => {
        await login('test@example.com', 'password')
      }

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          {user && <div>Logged in as {user.name}</div>}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    loginButton.click()

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken)
      expect(screen.getByText('Logged in as Test User')).toBeDefined()
    })
  })

  it('clears token from localStorage on logout', async () => {
    const TestComponent = () => {
      const { logout, user } = useAuth()
      
      return (
        <div>
          <button onClick={logout}>Logout</button>
          {user ? <div>User Present</div> : <div>No User</div>}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const logoutButton = screen.getByText('Logout')
    logoutButton.click()

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(screen.getByText('No User')).toBeDefined()
    })
  })
})
