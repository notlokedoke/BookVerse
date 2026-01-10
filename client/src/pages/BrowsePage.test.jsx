import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    // Reset URL to clean state before each test
    window.history.replaceState({}, '', '/browse');
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

  test('applies city filter when city input changes', async () => {
    // Mock initial API response
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

    // Mock filtered API response
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

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20');
    });

    // Change city filter
    const cityInput = screen.getByLabelText('City');
    fireEvent.change(cityInput, { target: { value: 'New York' } });

    // Wait for filtered API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20&city=New+York');
    });
  });

  test('applies multiple filters simultaneously', async () => {
    // Mock initial API response
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

    // Mock filtered API response
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

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20');
    });

    // Apply multiple filters
    const cityInput = screen.getByLabelText('City');
    const genreInput = screen.getByLabelText('Genre');
    const authorInput = screen.getByLabelText('Author');

    fireEvent.change(cityInput, { target: { value: 'Seattle' } });
    fireEvent.change(genreInput, { target: { value: 'Fantasy' } });
    fireEvent.change(authorInput, { target: { value: 'Tolkien' } });

    // Wait for API call with all filters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20&city=Seattle&genre=Fantasy&author=Tolkien');
    });

    // Verify URL is updated with all parameters
    expect(window.location.search).toContain('city=Seattle');
    expect(window.location.search).toContain('genre=Fantasy');
    expect(window.location.search).toContain('author=Tolkien');
  });

  test('initializes filters from URL parameters', async () => {
    // Mock API response
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

    // Render with URL parameters
    window.history.pushState({}, '', '/browse?city=Seattle&genre=Fiction&author=Tolkien&page=2');
    
    renderWithProviders(<BrowsePage />);

    // Wait for API call with URL parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=2&limit=20&city=Seattle&genre=Fiction&author=Tolkien');
    });

    // Check that filter inputs show URL values
    expect(screen.getByDisplayValue('Seattle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fiction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tolkien')).toBeInTheDocument();
  });

  test('clears filters when clear button is clicked', async () => {
    // Mock initial API response
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

    // Mock filtered API response
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

    // Mock cleared API response
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

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20');
    });

    // Add a filter
    const cityInput = screen.getByLabelText('City');
    fireEvent.change(cityInput, { target: { value: 'Boston' } });

    // Wait for filtered API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books?page=1&limit=20&city=Boston');
    });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Wait for cleared API call (should be the third call)
    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/books?page=1&limit=20');
    });

    // Check that input is cleared
    expect(cityInput.value).toBe('');
  });
});