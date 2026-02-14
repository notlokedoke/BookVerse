import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import WishlistForm from './WishlistForm';

vi.mock('axios');

const mockUser = {
  _id: '507f191e810c19729de860ea',
  name: 'Test User',
  email: 'test@example.com'
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast
}));

describe('WishlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders search UI and cancel button when onCancel is provided', () => {
    const onCancel = vi.fn();
    render(<WishlistForm onCancel={onCancel} />);

    expect(screen.getByText('Add Book to Wishlist')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by title, author, or isbn/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('shows no results message when search returns empty list', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: [] }
    });

    render(<WishlistForm />);

    fireEvent.change(screen.getByPlaceholderText(/search by title, author, or isbn/i), {
      target: { value: 'Nonexistent Book' }
    });

    await waitFor(() => {
      expect(screen.getByText(/no books found for "nonexistent book"/i)).toBeInTheDocument();
    });
  });

  test('selects a search result and shows confirmation state', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'book_1',
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            isbn: '9780743273565',
            thumbnail: 'https://example.com/gatsby.jpg'
          }
        ]
      }
    });

    render(<WishlistForm />);

    fireEvent.change(screen.getByPlaceholderText(/search by title, author, or isbn/i), {
      target: { value: 'gatsby' }
    });

    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('The Great Gatsby'));

    expect(screen.getByLabelText(/notes \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save to wishlist/i })).toBeInTheDocument();
  });

  test('submits selected book and calls onSuccess', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'book_1',
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            isbn: '9780743273565',
            thumbnail: 'https://example.com/gatsby.jpg'
          }
        ]
      }
    });

    const responseData = {
      _id: 'wish_1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      user: mockUser._id
    };

    axios.post.mockResolvedValueOnce({
      data: { success: true, data: responseData }
    });

    const onSuccess = vi.fn();
    render(<WishlistForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/search by title, author, or isbn/i), {
      target: { value: 'gatsby' }
    });

    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('The Great Gatsby'));
    fireEvent.change(screen.getByLabelText(/notes \(optional\)/i), {
      target: { value: 'Prefer hardcover' }
    });
    fireEvent.click(screen.getByRole('button', { name: /save to wishlist/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/wishlist'),
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '9780743273565',
          notes: 'Prefer hardcover',
          imageUrl: 'https://example.com/gatsby.jpg'
        }
      );
      expect(mockToast.success).toHaveBeenCalledWith('Book added to wishlist successfully!');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(responseData);
    }, { timeout: 2000 });
  });

  test('shows API error for duplicate wishlist item', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ id: 'book_1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' }]
      }
    });

    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            code: 'DUPLICATE_WISHLIST_ITEM',
            message: 'This book is already in your wishlist'
          }
        }
      }
    });

    render(<WishlistForm />);

    fireEvent.change(screen.getByPlaceholderText(/search by title, author, or isbn/i), {
      target: { value: 'gatsby' }
    });

    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('The Great Gatsby'));
    fireEvent.click(screen.getByRole('button', { name: /save to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByText('This book is already in your wishlist')).toBeInTheDocument();
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<WishlistForm onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
