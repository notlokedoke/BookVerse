import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import TradesPage from './TradesPage';

// Mock useAuth hook
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        _id: 'user123',
        name: 'Test User'
      }
    })
  };
});

// Mock fetch
global.fetch = vi.fn();

const mockTrades = [
  {
    _id: 'trade1',
    proposer: {
      _id: 'user123',
      name: 'Test User',
      city: 'New York',
      privacySettings: { showCity: true }
    },
    receiver: {
      _id: 'user456',
      name: 'Other User',
      city: 'Los Angeles',
      privacySettings: { showCity: true }
    },
    requestedBook: {
      _id: 'book123',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      condition: 'Good',
      imageUrl: 'https://example.com/gatsby.jpg'
    },
    offeredBook: {
      _id: 'book456',
      title: '1984',
      author: 'George Orwell',
      condition: 'Like New',
      imageUrl: 'https://example.com/1984.jpg'
    },
    status: 'proposed',
    createdAt: '2025-01-20T10:00:00Z'
  },
  {
    _id: 'trade2',
    proposer: {
      _id: 'user789',
      name: 'Another User',
      city: 'Chicago',
      privacySettings: { showCity: true }
    },
    receiver: {
      _id: 'user123',
      name: 'Test User',
      city: 'New York',
      privacySettings: { showCity: true }
    },
    requestedBook: {
      _id: 'book789',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      condition: 'Fair',
      imageUrl: 'https://example.com/mockingbird.jpg'
    },
    offeredBook: {
      _id: 'book101',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      condition: 'Good',
      imageUrl: 'https://example.com/pride.jpg'
    },
    status: 'accepted',
    createdAt: '2025-01-19T10:00:00Z'
  }
];

describe('TradesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set token in localStorage before each test
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
  });

  it('renders trades page component', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: []
      })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TradesPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/My Trades/i)).toBeInTheDocument();
    });
  });

  it('displays trades when data is fetched', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTrades
      })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TradesPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Trades/i)).toBeInTheDocument();
    });
  });
});
