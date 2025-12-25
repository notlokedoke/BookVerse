import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
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

    renderWithProviders(<UserProfilePage />);

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

    renderWithProviders(<UserProfilePage />);

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
});