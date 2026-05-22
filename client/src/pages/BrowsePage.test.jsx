import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrowsePage from './BrowsePage';
import { vi } from 'vitest';

global.fetch = vi.fn();

const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

const emptyPageResponse = {
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
};

describe('BrowsePage', () => {
  beforeEach(() => {
    fetch.mockReset();
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    });
    window.history.replaceState({}, '', '/browse');
  });

  test('renders browse page with title and filters', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);

    renderWithProviders(<BrowsePage />);

    expect(await screen.findByText('Discover Books')).toBeInTheDocument();
    expect(screen.getByText(/books available for trade/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Author')).toBeInTheDocument();
  });

  test('displays empty state when no books are found', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText('No Books Found')).toBeInTheDocument();
    });

    expect(screen.getByText(/We couldn't find any books matching your search criteria/)).toBeInTheDocument();
  });

  test('displays error state when API call fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Books')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('makes API call with correct parameters', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books?page=1&limit=25')
      );
    });
  });

  test('applies city filter when city input changes', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);
    fetch.mockResolvedValueOnce(emptyPageResponse);

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books?page=1&limit=25')
      );
    });

    const cityInput = screen.getByPlaceholderText('City');
    fireEvent.change(cityInput, { target: { value: 'New York' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books?page=1&limit=25&city=New+York')
      );
    }, { timeout: 2000 });
  });

  test('applies multiple filters simultaneously', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);
    fetch.mockResolvedValueOnce(emptyPageResponse);

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books?page=1&limit=25')
      );
    });

    const cityInput = screen.getByPlaceholderText('City');
    const authorInput = screen.getByPlaceholderText('Author');

    fireEvent.change(cityInput, { target: { value: 'Seattle' } });
    fireEvent.change(authorInput, { target: { value: 'Tolkien' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('city=Seattle')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('author=Tolkien')
      );
    }, { timeout: 2000 });

    expect(window.location.search).toContain('city=Seattle');
    expect(window.location.search).toContain('author=Tolkien');
  });

  test('initializes filters from URL parameters', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);

    window.history.pushState({}, '', '/browse?city=Seattle&author=Tolkien&page=2');

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books?page=2&limit=25')
      );
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('city=Seattle'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('author=Tolkien'));

    expect(screen.getByDisplayValue('Seattle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tolkien')).toBeInTheDocument();
  });

  test('clears filters when clear button is clicked', async () => {
    fetch.mockResolvedValueOnce(emptyPageResponse);
    fetch.mockResolvedValueOnce(emptyPageResponse);
    fetch.mockResolvedValueOnce(emptyPageResponse);

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books?page=1&limit=25')
      );
    });

    const cityInput = screen.getByPlaceholderText('City');
    fireEvent.change(cityInput, { target: { value: 'Boston' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('city=Boston')
      );
    }, { timeout: 2000 });

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('City')).toHaveValue('');
    });
  });
});
