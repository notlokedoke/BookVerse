import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TradeProposalModal from './TradeProposalModal';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock data
const mockUser = {
  _id: '507f191e810c19729de860eb',
  name: 'Jane Smith'
};

const mockRequestedBook = {
  _id: '507f1f77bcf86cd799439011',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  condition: 'Good',
  imageUrl: 'https://example.com/gatsby.jpg'
};

const mockUserBooks = [
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    condition: 'Like New',
    imageUrl: 'https://example.com/mockingbird.jpg',
    isAvailable: true
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: '1984',
    author: 'George Orwell',
    condition: 'Good',
    imageUrl: 'https://example.com/1984.jpg',
    isAvailable: true
  }
];

describe('TradeProposalModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnClose.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockUseAuth.mockReturnValue({ user: mockUser });
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <TradeProposalModal
        isOpen={false}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders modal when isOpen is true', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    expect(screen.getByText('Propose Trade')).toBeInTheDocument();
  });

  test('displays requested book information', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    expect(screen.getByText('You want to trade for:')).toBeInTheDocument();
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('by F. Scott Fitzgerald')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  test('fetches and displays user books', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
      expect(screen.getByText('Harper Lee')).toBeInTheDocument();
      expect(screen.getByText('1984')).toBeInTheDocument();
      expect(screen.getByText('George Orwell')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/books/user/${mockUser._id}`),
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })
    );
  });

  test('displays loading state while fetching books', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    expect(screen.getByText('Loading your books...')).toBeInTheDocument();
  });

  test('displays message when user has no available books', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("You don't have any available books to offer.")).toBeInTheDocument();
      expect(screen.getByText('Create a book listing first to propose trades.')).toBeInTheDocument();
    });
  });

  test('filters out unavailable books', async () => {
    const booksWithUnavailable = [
      ...mockUserBooks,
      {
        _id: '507f1f77bcf86cd799439014',
        title: 'Unavailable Book',
        author: 'Test Author',
        condition: 'Good',
        imageUrl: 'https://example.com/unavailable.jpg',
        isAvailable: false
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: booksWithUnavailable })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
      expect(screen.getByText('1984')).toBeInTheDocument();
      expect(screen.queryByText('Unavailable Book')).not.toBeInTheDocument();
    });
  });

  test('allows selecting a book to offer', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    });

    const bookOption = screen.getByText('To Kill a Mockingbird').closest('.book-option');
    fireEvent.click(bookOption);

    expect(bookOption).toHaveClass('selected');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  test('submits trade proposal successfully', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserBooks })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { _id: 'trade123' } })
      });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    });

    // Select a book
    const bookOption = screen.getByText('To Kill a Mockingbird').closest('.book-option');
    fireEvent.click(bookOption);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /propose trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Trade Proposed Successfully!')).toBeInTheDocument();
      expect(screen.getByText('The book owner will be notified of your trade proposal.')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/trades'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          requestedBook: mockRequestedBook._id,
          offeredBook: mockUserBooks[0]._id
        })
      })
    );
  });

  test('displays error when no book is selected', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    });

    // Try to submit without selecting a book
    const submitButton = screen.getByRole('button', { name: /propose trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a book to offer')).toBeInTheDocument();
    });
  });

  test('displays error when trade proposal fails', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserBooks })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'You cannot request your own book' }
        })
      });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    });

    // Select a book
    const bookOption = screen.getByText('To Kill a Mockingbird').closest('.book-option');
    fireEvent.click(bookOption);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /propose trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('You cannot request your own book')).toBeInTheDocument();
    });
  });

  test('closes modal when close button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Propose Trade')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Propose Trade')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when overlay is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Propose Trade')).toBeInTheDocument();
    });

    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not close modal when modal content is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUserBooks })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Propose Trade')).toBeInTheDocument();
    });

    const modalContent = document.querySelector('.modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('disables submit button when no books are available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /propose trade/i });
      expect(submitButton).toBeDisabled();
    });
  });

  test('disables buttons while submitting', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserBooks })
      })
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    });

    // Select a book
    const bookOption = screen.getByText('To Kill a Mockingbird').closest('.book-option');
    fireEvent.click(bookOption);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /propose trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Proposing...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  test('automatically closes modal after successful submission', async () => {
    vi.useFakeTimers();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserBooks })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { _id: 'trade123' } })
      });

    render(
      <TradeProposalModal
        isOpen={true}
        onClose={mockOnClose}
        requestedBook={mockRequestedBook}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    });

    // Select a book
    const bookOption = screen.getByText('To Kill a Mockingbird').closest('.book-option');
    fireEvent.click(bookOption);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /propose trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Trade Proposed Successfully!')).toBeInTheDocument();
    });

    // Fast-forward time
    vi.advanceTimersByTime(2000);

    expect(mockOnClose).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
