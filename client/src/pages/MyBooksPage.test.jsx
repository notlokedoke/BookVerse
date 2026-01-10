import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import MyBooksPage from './MyBooksPage';
import { useAuth } from '../context/AuthContext';

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock axios
vi.mock('axios');

// Mock BookCard component
vi.mock('../components/BookCard', () => ({
  default: ({ book, showEditButton, onEdit, showDeleteButton, onDelete }) => (
    <div data-testid="book-card">
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      {showEditButton && (
        <button onClick={() => onEdit(book)} data-testid="edit-button">
          Edit
        </button>
      )}
      {showDeleteButton && (
        <button onClick={() => onDelete(book)} data-testid="delete-button">
          Delete
        </button>
      )}
    </div>
  )
}));

// Mock EditBookModal component
vi.mock('../components/EditBookModal', () => ({
  default: ({ isOpen, book, onClose, onBookUpdated }) => (
    isOpen ? (
      <div data-testid="edit-modal">
        <h2>Edit Book: {book?.title}</h2>
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button 
          onClick={() => {
            onBookUpdated({ ...book, title: 'Updated Title' });
            onClose();
          }} 
          data-testid="update-book"
        >
          Update
        </button>
      </div>
    ) : null
  )
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MyBooksPage', () => {
  const mockUser = {
    _id: '123',
    name: 'Test User',
    email: 'test@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially', () => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<MyBooksPage />);

    expect(screen.getByText('Loading your books...')).toBeInTheDocument();
  });

  test('renders empty state when user has no books', async () => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: [] }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('No Books Listed Yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create Your First Listing')).toBeInTheDocument();
  });

  test('renders books when user has books', async () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction'
      },
      {
        _id: '2',
        title: 'Test Book 2',
        author: 'Author 2',
        condition: 'Like New',
        genre: 'Non-Fiction'
      }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: mockBooks }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Books Listed')).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('book-card')).toHaveLength(2);
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
  });

  test('renders error state when API call fails', async () => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Books')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('calls correct API endpoint with user ID', async () => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: [] }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/books/user/123');
    });
  });

  test('renders create new listing button', async () => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: [] }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Create New Listing')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create New Listing').closest('a');
    expect(createButton).toHaveAttribute('href', '/books/create');
  });

  test('shows edit buttons for user books and opens edit modal', async () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction'
      }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: mockBooks }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByTestId('edit-button'));

    // Check that modal opens
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Book: Test Book 1')).toBeInTheDocument();
  });

  test('updates book in list when edit modal saves changes', async () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction'
      }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: mockBooks }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByTestId('edit-button'));

    // Click update button in modal
    fireEvent.click(screen.getByTestId('update-book'));

    // Check that the book title was updated in the list
    await waitFor(() => {
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
    });
  });

  test('shows delete buttons for user books and opens confirmation dialog', async () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction'
      }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: mockBooks }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-button'));

    // Check that confirmation dialog opens
    expect(screen.getByText('Delete Book Listing')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this book listing?')).toBeInTheDocument();
    expect(screen.getByText('"Test Book 1"')).toBeInTheDocument();
    expect(screen.getByText('Author 1')).toBeInTheDocument();
  });

  test('deletes book when confirmed in dialog', async () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction'
      }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: mockBooks }
      }
    });
    axios.delete.mockResolvedValue({
      data: {
        success: true,
        message: 'Book listing deleted successfully'
      }
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-button'));

    // Click confirm delete button
    fireEvent.click(screen.getByText('Delete Book'));

    // Check that delete API was called
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/books/1', {
        headers: {
          Authorization: 'Bearer mock-token'
        }
      });
    });

    // Check that book was removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Test Book 1')).not.toBeInTheDocument();
    });
  });

  test('cancels delete when cancel button is clicked', async () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction'
      }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { books: mockBooks }
      }
    });

    renderWithRouter(<MyBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-button'));

    // Check that confirmation dialog opens
    expect(screen.getByText('Delete Book Listing')).toBeInTheDocument();

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Check that dialog closes and book is still there
    expect(screen.queryByText('Delete Book Listing')).not.toBeInTheDocument();
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
  });
});