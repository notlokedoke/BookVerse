import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import WishlistForm from './WishlistForm';
import { AuthProvider } from '../context/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock user data
const mockUser = {
  _id: '507f191e810c19729de860ea',
  name: 'Test User',
  email: 'test@example.com',
  city: 'Test City'
};

// Mock AuthContext
const MockAuthProvider = ({ children }) => {
  const mockAuthValue = {
    user: mockUser,
    token: 'mock-token',
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn()
  };

  return (
    <AuthProvider value={mockAuthValue}>
      {children}
    </AuthProvider>
  );
};

describe('WishlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders wishlist form with all required fields', () => {
    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    // Check if form elements are present
    expect(screen.getByText('Add Book to Wishlist')).toBeInTheDocument();
    expect(screen.getByLabelText(/book title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/isbn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to wishlist/i })).toBeInTheDocument();
  });

  test('shows validation error when title is empty', async () => {
    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /add to wishlist/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Book',
          author: 'Test Author',
          user: mockUser._id
        },
        message: 'Book added to wishlist successfully'
      }
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const onSuccess = vi.fn();

    render(
      <MockAuthProvider>
        <WishlistForm onSuccess={onSuccess} />
      </MockAuthProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/book title/i), {
      target: { value: 'Test Book' }
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/wishlist',
        {
          title: 'Test Book',
          author: 'Test Author'
        }
      );
      expect(onSuccess).toHaveBeenCalledWith(mockResponse.data.data);
      expect(screen.getByText('Book added to wishlist successfully!')).toBeInTheDocument();
    });
  });

  test('handles API error responses', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          error: {
            message: 'This book is already in your wishlist',
            code: 'DUPLICATE_WISHLIST_ITEM'
          }
        }
      }
    };

    mockedAxios.post.mockRejectedValueOnce(mockError);

    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/book title/i), {
      target: { value: 'Test Book' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByText('This book is already in your wishlist')).toBeInTheDocument();
    });
  });

  test('validates ISBN format', async () => {
    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    // Fill in invalid ISBN
    fireEvent.change(screen.getByLabelText(/book title/i), {
      target: { value: 'Test Book' }
    });
    fireEvent.change(screen.getByLabelText(/isbn/i), {
      target: { value: 'invalid-isbn' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid ISBN (10 or 13 digits)')).toBeInTheDocument();
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();

    render(
      <MockAuthProvider>
        <WishlistForm onCancel={onCancel} />
      </MockAuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});