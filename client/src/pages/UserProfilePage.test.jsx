import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import UserProfilePage from './UserProfilePage';

// Mock AuthContext
const mockAuthContext = {
  user: { _id: '507f191e810c19729de860ea', name: 'Test User' },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock fetch
global.fetch = vi.fn();

const renderWithProviders = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/profile" element={component} />
        <Route path="/profile/:userId" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

describe('UserProfilePage', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders user profile with wishlist section', async () => {
    // Mock user profile API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          _id: '507f191e810c19729de860ea',
          name: 'Test User',
          city: 'New York',
          averageRating: 4.5,
          ratingCount: 10
        }
      })
    });

    // Mock wishlist API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            isbn: '9780743273565',
            notes: 'Looking for a good condition copy',
            createdAt: '2025-01-17T10:00:00Z'
          }
        ]
      })
    });

    renderWithProviders(<UserProfilePage />, ['/profile']);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Check if wishlist section is present
    expect(screen.getByText('My Wishlist')).toBeInTheDocument();
    
    // Wait for wishlist to load
    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    });

    // Check if wishlist item is properly formatted
    expect(screen.getByText('by F. Scott Fitzgerald')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 9780743273565')).toBeInTheDocument();
    expect(screen.getByText('Looking for a good condition copy')).toBeInTheDocument();
  });

  test('displays empty wishlist state appropriately', async () => {
    // Mock user profile API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          _id: '507f191e810c19729de860ea',
          name: 'Test User',
          city: 'New York',
          averageRating: 0,
          ratingCount: 0
        }
      })
    });

    // Mock empty wishlist API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: []
      })
    });

    renderWithProviders(<UserProfilePage />, ['/profile']);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Check if wishlist section is present
    expect(screen.getByText('My Wishlist')).toBeInTheDocument();
    
    // Wait for empty wishlist message
    await waitFor(() => {
      expect(screen.getByText(/You haven't added any books to your wishlist yet/)).toBeInTheDocument();
    });

    // Check if add book button is present for own profile
    expect(screen.getByText('Add Your First Book')).toBeInTheDocument();
  });

  test('displays other user\'s wishlist publicly (Requirement 7.5)', async () => {
    // Test that wishlist endpoint is publicly accessible by testing the WishlistSection component directly
    // This verifies that the wishlist can be viewed without authentication
    
    const otherUserId = '507f191e810c19729de860eb';
    
    // Mock other user's wishlist API response (publicly accessible - no auth required)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            title: '1984',
            author: 'George Orwell',
            isbn: '9780451524935',
            notes: 'Looking for first edition',
            createdAt: '2025-01-17T09:00:00Z'
          },
          {
            _id: '507f1f77bcf86cd799439013',
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            createdAt: '2025-01-17T08:00:00Z'
          }
        ]
      })
    });

    // Import and render WishlistSection directly to test public access
    const { default: WishlistSection } = await import('../components/WishlistSection');
    
    render(
      <WishlistSection 
        userId={otherUserId} 
        isOwnProfile={false} 
      />
    );

    // Wait for wishlist items to load
    await waitFor(() => {
      expect(screen.getByText('1984')).toBeInTheDocument();
    });

    // Verify wishlist items are displayed
    expect(screen.getByText('by George Orwell')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 9780451524935')).toBeInTheDocument();
    expect(screen.getByText('Looking for first edition')).toBeInTheDocument();
    expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    expect(screen.getByText('by Harper Lee')).toBeInTheDocument();

    // Check that it shows "Wishlist" (not "My Wishlist") for other users
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
    expect(screen.queryByText('My Wishlist')).not.toBeInTheDocument();

    // Verify that add/remove buttons are NOT shown for other users
    expect(screen.queryByText('+ Add Book')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Your First Book')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();

    // Verify the API call was made correctly (publicly accessible)
    expect(fetch).toHaveBeenCalledWith(`/api/wishlist/user/${otherUserId}`);
    
    // Verify no Authorization header was sent (public access)
    const fetchCall = fetch.mock.calls[0];
    expect(fetchCall[1]).toBeUndefined(); // No second parameter means no headers
  });
});