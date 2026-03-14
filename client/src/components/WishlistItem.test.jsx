import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import axios from 'axios';
import WishlistItem from './WishlistItem';
import { useAuth } from '../context/AuthContext';

vi.mock('axios');

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('WishlistItem', () => {
  const mockItem = {
    _id: 'wishlist123',
    title: 'Test Book',
    author: 'Test Author',
    isbn: '1234567890',
    notes: 'Test notes',
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  const mockOnRemove = vi.fn();
  let confirmSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    vi.mocked(useAuth).mockReturnValue({
      user: { _id: 'user123', name: 'Test User' }
    });
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('renders wishlist item with all information', () => {
    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={false} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 1234567890')).toBeInTheDocument();
    expect(screen.getByText('"Test notes"')).toBeInTheDocument();
    expect(screen.getByText(/Added/)).toBeInTheDocument();
  });

  it('renders wishlist item without optional fields', () => {
    const minimalItem = {
      _id: 'wishlist123',
      title: 'Test Book',
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    render(<WishlistItem item={minimalItem} onRemove={mockOnRemove} isOwnProfile={false} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    expect(screen.queryByText(/ISBN:/)).not.toBeInTheDocument();
  });

  it('shows remove button when isOwnProfile is true', () => {
    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={true} />);
    expect(screen.getByTitle('Remove from wishlist')).toBeInTheDocument();
  });

  it('does not show remove button when isOwnProfile is false', () => {
    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={false} />);
    expect(screen.queryByTitle('Remove from wishlist')).not.toBeInTheDocument();
  });

  it('does not remove item when confirm is cancelled', async () => {
    confirmSpy.mockReturnValueOnce(false);
    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={true} />);

    fireEvent.click(screen.getByTitle('Remove from wishlist'));

    expect(window.confirm).toHaveBeenCalled();
    expect(axios.delete).not.toHaveBeenCalled();
    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('successfully removes item when confirmed', async () => {
    axios.delete.mockResolvedValueOnce({
      data: { success: true, message: 'Book removed from wishlist successfully' }
    });

    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={true} />);
    fireEvent.click(screen.getByTitle('Remove from wishlist'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/wishlist/wishlist123'),
        {
          headers: {
            Authorization: 'Bearer mock-token'
          }
        }
      );
      expect(mockToast.success).toHaveBeenCalledWith('Book removed from wishlist successfully!');
      expect(mockOnRemove).toHaveBeenCalledWith('wishlist123');
    });
  });

  it('handles removal error gracefully', async () => {
    axios.delete.mockRejectedValueOnce(new Error('Network error'));
    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={true} />);

    fireEvent.click(screen.getByTitle('Remove from wishlist'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to remove book from wishlist. Please try again.');
    });

    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('shows loading state during removal', async () => {
    axios.delete.mockImplementation(() => new Promise(() => {}));
    render(<WishlistItem item={mockItem} onRemove={mockOnRemove} isOwnProfile={true} />);

    fireEvent.click(screen.getByTitle('Remove from wishlist'));

    expect(screen.getByText('Removing...')).toBeInTheDocument();
  });
});
