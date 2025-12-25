import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import WishlistItem from './WishlistItem';
import { useAuth } from '../context/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Mock useAuth return value
    vi.mocked(useAuth).mockReturnValue({
      user: { _id: 'user123', name: 'Test User' },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    });
  });

  it('renders wishlist item with all information', () => {
    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={false} 
      />
    );

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 1234567890')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
    expect(screen.getByText(/Added/)).toBeInTheDocument();
  });

  it('renders wishlist item without optional fields', () => {
    const minimalItem = {
      _id: 'wishlist123',
      title: 'Test Book',
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    render(
      <WishlistItem 
        item={minimalItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={false} 
      />
    );

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.queryByText(/by/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ISBN:/)).not.toBeInTheDocument();
  });

  it('shows remove button when isOwnProfile is true', () => {
    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={true} 
      />
    );

    expect(screen.getByTitle('Remove from wishlist')).toBeInTheDocument();
  });

  it('does not show remove button when isOwnProfile is false', () => {
    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={false} 
      />
    );

    expect(screen.queryByTitle('Remove from wishlist')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when remove button is clicked', () => {
    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={true} 
      />
    );

    const removeButton = screen.getByTitle('Remove from wishlist');
    fireEvent.click(removeButton);

    expect(screen.getByText('Remove this book?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('cancels removal when No is clicked', () => {
    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={true} 
      />
    );

    const removeButton = screen.getByTitle('Remove from wishlist');
    fireEvent.click(removeButton);

    const noButton = screen.getByRole('button', { name: 'No' });
    fireEvent.click(noButton);

    expect(screen.queryByText('Remove this book?')).not.toBeInTheDocument();
    expect(screen.getByTitle('Remove from wishlist')).toBeInTheDocument();
  });

  it('successfully removes item when confirmed', async () => {
    mockedAxios.delete.mockResolvedValue({
      data: { success: true, message: 'Book removed from wishlist successfully' }
    });

    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={true} 
      />
    );

    const removeButton = screen.getByTitle('Remove from wishlist');
    fireEvent.click(removeButton);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    fireEvent.click(yesButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        '/api/wishlist/wishlist123',
        {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        }
      );
    });

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('wishlist123');
    });
  });

  it('handles removal error gracefully', async () => {
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    mockedAxios.delete.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Failed to remove item'
          }
        }
      }
    });

    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={true} 
      />
    );

    const removeButton = screen.getByTitle('Remove from wishlist');
    fireEvent.click(removeButton);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    fireEvent.click(yesButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to remove item');
    });

    expect(mockOnRemove).not.toHaveBeenCalled();
    
    mockAlert.mockRestore();
  });

  it('shows loading state during removal', async () => {
    mockedAxios.delete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <WishlistItem 
        item={mockItem} 
        onRemove={mockOnRemove} 
        isOwnProfile={true} 
      />
    );

    const removeButton = screen.getByTitle('Remove from wishlist');
    fireEvent.click(removeButton);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    fireEvent.click(yesButton);

    expect(screen.getByText('Removing...')).toBeInTheDocument();
  });
});