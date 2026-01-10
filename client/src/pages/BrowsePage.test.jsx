import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import BrowsePage from './BrowsePage';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock AuthContext
const mockAuthContext = {
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn()
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BrowsePage', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders browse page with title and filters', () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          books: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalBooks: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      })
    });

    renderWithProviders(<BrowsePage />);

    // Check if main elements are rendered
    expect(screen.getByText('Browse Books')).toBeInTheDocument();
    expect(screen.getByText('Discover books available for trade in your community')).toBeInTheDocument();
    
    // Check if filter inputs are present
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Genre')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
  });

  test('displays empty state when no books are found', async () => {
    // Mock API response with no books
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          books: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalBooks: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      })
    });

    renderWithProviders(<BrowsePage />);

    // Wait for the API call to complete and empty state to show
    await waitFor(() => {
      expect(screen.getByText('No Books Found')).toBeInTheDocument();
    });

    expect(screen.getByText(/We couldn't find any books matching your search criteria/)).toBeInTheDocument();
  });

  test('displays error state when API call fails', async () => {
    // Mock API failure
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<BrowsePage />);

    // Wait for the error state to show
    await waitFor(() => {
      expect(screen.getByText('Unable to Load Books')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('makes API call with correct parameters', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          books: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalBooks: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      })
    });

    renderWithProviders(<BrowsePage />);

    // Wait for the API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20');
    });
  });
});