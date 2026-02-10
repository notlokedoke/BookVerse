import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import UserProfilePage from './UserProfilePage';

// Mock axios
vi.mock('axios');

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
    axios.get.mockClear();
    localStorage.setItem('token', 'fake-token');
  });

  test('renders user profile with ratings section', async () => {
    const mockUser = {
      _id: '507f191e810c19729de860ea',
      name: 'Test User',
      city: 'New York',
      averageRating: 4.5,
      ratingCount: 2,
      privacySettings: { showCity: true }
    };

    const mockBooks = [
      {
        _id: 'book1',
        title: 'Test Book',
        author: 'Test Author',
        imageUrl: 'http://example.com/image.jpg'
      }
    ];

    const mockWishlist = [
      {
        _id: 'wish1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald'
      }
    ];

    const mockRatings = [
      {
        _id: 'rating1',
        stars: 5,
        comment: 'Great trader!',
        createdAt: '2025-01-17T10:00:00Z',
        rater: {
          _id: 'rater1',
          name: 'John Doe',
          city: 'Boston'
        }
      },
      {
        _id: 'rating2',
        stars: 4,
        comment: 'Good experience',
        createdAt: '2025-01-16T10:00:00Z',
        rater: {
          _id: 'rater2',
          name: 'Jane Smith',
          city: 'Chicago'
        }
      }
    ];

    // Mock API responses
    axios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockUser } }) // User profile
      .mockResolvedValueOnce({ data: { success: true, data: { books: mockBooks } } }) // Books
      .mockResolvedValueOnce({ data: { success: true, data: mockWishlist } }) // Wishlist
      .mockResolvedValueOnce({ data: { success: true, data: mockRatings } }); // Ratings

    renderWithProviders(<UserProfilePage />, ['/profile']);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Check if ratings section is present
    await waitFor(() => {
      expect(screen.getAllByText('Reviews')).toHaveLength(2); // One in stats, one in section header
    });

    // Check if ratings are displayed
    await waitFor(() => {
      expect(screen.getByText('Great trader!')).toBeInTheDocument();
      expect(screen.getByText('Good experience')).toBeInTheDocument();
    });

    // Verify RatingDisplay is shown in header
    expect(screen.getByText('(2 ratings)')).toBeInTheDocument();

    // Verify API calls
    expect(axios.get).toHaveBeenCalledWith(
      '/api/users/507f191e810c19729de860ea',
      expect.any(Object)
    );
    expect(axios.get).toHaveBeenCalledWith('/api/ratings/user/507f191e810c19729de860ea');
  });

  test('displays "No ratings yet" when user has no ratings', async () => {
    const mockUser = {
      _id: '507f191e810c19729de860ea',
      name: 'Test User',
      city: 'New York',
      averageRating: 0,
      ratingCount: 0,
      privacySettings: { showCity: true }
    };

    // Mock API responses
    axios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockUser } }) // User profile
      .mockResolvedValueOnce({ data: { success: true, data: { books: [] } } }) // Books
      .mockResolvedValueOnce({ data: { success: true, data: [] } }) // Wishlist
      .mockResolvedValueOnce({ data: { success: true, data: [] } }); // Ratings (empty)

    renderWithProviders(<UserProfilePage />, ['/profile']);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Check if ratings section is present
    await waitFor(() => {
      expect(screen.getAllByText('Reviews')).toHaveLength(2); // One in stats, one in section header
    });

    // Check if "No ratings yet" message is displayed
    await waitFor(() => {
      expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    });

    // Verify RatingDisplay shows 0 ratings
    expect(screen.getByText('(0 ratings)')).toBeInTheDocument();
  });

  test('fetches and displays ratings when viewing another user profile', async () => {
    const otherUserId = '507f191e810c19729de860eb';
    
    const mockUser = {
      _id: otherUserId,
      name: 'Other User',
      city: 'Boston',
      averageRating: 4.8,
      ratingCount: 5,
      privacySettings: { showCity: true }
    };

    const mockRatings = [
      {
        _id: 'rating1',
        stars: 5,
        comment: 'Excellent trader!',
        createdAt: '2025-01-17T10:00:00Z',
        rater: {
          _id: 'rater1',
          name: 'Alice',
          city: 'Seattle'
        }
      }
    ];

    // Mock API responses
    axios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockUser } }) // User profile
      .mockResolvedValueOnce({ data: { success: true, data: { books: [] } } }) // Books
      .mockResolvedValueOnce({ data: { success: true, data: [] } }) // Wishlist
      .mockResolvedValueOnce({ data: { success: true, data: mockRatings } }); // Ratings

    renderWithProviders(<UserProfilePage />, [`/profile/${otherUserId}`]);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });

    // Check if ratings are displayed
    await waitFor(() => {
      expect(screen.getByText('Excellent trader!')).toBeInTheDocument();
    });

    // Verify API call was made for the correct user
    expect(axios.get).toHaveBeenCalledWith(`/api/ratings/user/${otherUserId}`);
  });
});