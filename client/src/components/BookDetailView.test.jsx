import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookDetailView from './BookDetailView';
import { vi } from 'vitest';

// Mock useParams
const mockBookId = '507f1f77bcf86cd799439011';
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ bookId: mockBookId }),
    useNavigate: () => mockNavigate
  };
});

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock data
const mockBook = {
  _id: '507f1f77bcf86cd799439011',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  condition: 'Good',
  genre: 'Classic Fiction',
  isbn: '9780743273565',
  description: 'A classic American novel about the Jazz Age.',
  publicationYear: 1925,
  publisher: 'Scribner',
  imageUrl: 'https://example.com/book-image.jpg',
  isAvailable: true,
  createdAt: '2025-01-01T10:00:00Z',
  owner: {
    _id: '507f191e810c19729de860ea',
    name: 'John Doe',
    city: 'New York',
    averageRating: 4.5,
    ratingCount: 10,
    privacySettings: {
      showCity: true
    }
  }
};

const mockUser = {
  _id: '507f191e810c19729de860eb',
  name: 'Jane Smith'
};

const mockOwnerUser = {
  _id: '507f191e810c19729de860ea',
  name: 'John Doe'
};

const renderWithProviders = (user = mockUser) => {
  mockUseAuth.mockReturnValue({ user, isAuthenticated: true });
  
  return render(
    <BrowserRouter>
      <BookDetailView />
    </BrowserRouter>
  );
};

describe('BookDetailView', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockUseAuth.mockClear();
    mockNavigate.mockClear();
  });

  test('displays loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithProviders();
    
    expect(screen.getByText('Loading book details...')).toBeInTheDocument();
  });

  test('displays book information correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockBook })
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
      expect(screen.getByText('by F. Scott Fitzgerald')).toBeInTheDocument();
      expect(screen.getAllByText('Classic Fiction')).toHaveLength(2); // Appears in tag and details
      expect(screen.getAllByText('Good')).toHaveLength(2); // Appears in badge and details
      expect(screen.getByText('ISBN: 9780743273565')).toBeInTheDocument();
      expect(screen.getByText('A classic American novel about the Jazz Age.')).toBeInTheDocument();
      expect(screen.getByText('1925')).toBeInTheDocument();
      expect(screen.getByText('Scribner')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });

  test('displays owner information correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockBook })
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('📍 New York')).toBeInTheDocument();
      expect(screen.getByText('4.5 (10 reviews)')).toBeInTheDocument();
    });
  });

  test('hides city when privacy setting is false', async () => {
    const bookWithPrivateCity = {
      ...mockBook,
      owner: {
        ...mockBook.owner,
        privacySettings: {
          showCity: false
        }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: bookWithPrivateCity })
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('📍 New York')).not.toBeInTheDocument();
    });
  });

  test('shows owner actions when user owns the book', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockBook })
    });

    renderWithProviders(mockOwnerUser);

    await waitFor(() => {
      expect(screen.getByText('Edit Listing')).toBeInTheDocument();
      expect(screen.getByText('Delete Listing')).toBeInTheDocument();
      expect(screen.queryByText('Propose Trade')).not.toBeInTheDocument();
    });
  });

  test('shows visitor actions when user does not own the book', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockBook })
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Propose Trade')).toBeInTheDocument();
      expect(screen.getByText("View Owner's Books")).toBeInTheDocument();
      expect(screen.queryByText('Edit Listing')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Listing')).not.toBeInTheDocument();
    });
  });

  test('disables propose trade button when book is not available', async () => {
    const unavailableBook = {
      ...mockBook,
      isAvailable: false
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: unavailableBook })
    });

    renderWithProviders();

    await waitFor(() => {
      const proposeButton = screen.getByRole('button', { name: /not available/i });
      expect(proposeButton).toBeDisabled();
    });
  });

  test('displays error state when book is not found', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Book not found')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });

  test('displays error state when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to server. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles missing optional fields gracefully', async () => {
    const minimalBook = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Simple Book',
      author: 'Simple Author',
      condition: 'Good',
      genre: 'Fiction',
      imageUrl: 'https://example.com/book-image.jpg',
      isAvailable: true,
      createdAt: '2025-01-01T10:00:00Z',
      owner: {
        _id: '507f191e810c19729de860ea',
        name: 'John Doe',
        averageRating: 0,
        ratingCount: 0
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: minimalBook })
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Simple Book')).toBeInTheDocument();
      expect(screen.getByText('by Simple Author')).toBeInTheDocument();
      expect(screen.queryByText(/isbn:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/publication year/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/publisher/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
      expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
    });
  });

  test('creates correct links', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockBook })
    });

    renderWithProviders();

    await waitFor(() => {
      const ownerProfileLink = screen.getByRole('link', { name: /john doe/i });
      expect(ownerProfileLink).toHaveAttribute('href', '/profile/507f191e810c19729de860ea');
      
      const viewOwnerBooksLink = screen.getByRole('link', { name: /view owner's books/i });
      expect(viewOwnerBooksLink).toHaveAttribute('href', '/profile/507f191e810c19729de860ea');
    });
  });

  test('applies correct condition classes', async () => {
    const conditions = [
      { condition: 'New', expectedClass: 'condition-new' },
      { condition: 'Like New', expectedClass: 'condition-like-new' },
      { condition: 'Fair', expectedClass: 'condition-fair' },
      { condition: 'Poor', expectedClass: 'condition-poor' }
    ];

    for (const { condition, expectedClass } of conditions) {
      const bookWithCondition = { ...mockBook, condition };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: bookWithCondition })
      });

      const { unmount } = renderWithProviders();

      await waitFor(() => {
        const conditionElements = screen.getAllByText(condition);
        expect(conditionElements[0]).toHaveClass(expectedClass);
      });

      unmount();
      fetch.mockClear();
    }
  });

  test('formats date correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockBook })
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('January 1, 2025')).toBeInTheDocument();
    });
  });
});