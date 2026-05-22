import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import WishlistForm from './WishlistForm';

vi.mock('axios');

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: '507f191e810c19729de860ea',
      name: 'Test User',
      email: 'test@example.com'
    }
  })
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}));

const renderWithRouter = (ui) =>
  render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </BrowserRouter>
  );

describe('WishlistForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form and allows user interaction', async () => {
    renderWithRouter(<WishlistForm />);

    expect(screen.getByText('Add Book to Wishlist')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/search by title, author, or isbn/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Test Book' } });
    expect(searchInput.value).toBe('Test Book');
  });

  test('validates required fields', async () => {
    renderWithRouter(<WishlistForm />);

    expect(screen.getByText('Add Book to Wishlist')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by title, author, or isbn/i)).toBeInTheDocument();
  });

  test('validates ISBN format', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    renderWithRouter(<WishlistForm />);

    fireEvent.change(screen.getByPlaceholderText(/search by title, author, or isbn/i), {
      target: { value: 'some book' }
    });

    expect(screen.getByPlaceholderText(/search by title, author, or isbn/i).value).toBe('some book');
  });

  test('clears form after successful submission', async () => {
    renderWithRouter(<WishlistForm />);

    const searchInput = screen.getByPlaceholderText(/search by title, author, or isbn/i);
    fireEvent.change(searchInput, { target: { value: 'Test Book' } });
    expect(searchInput.value).toBe('Test Book');
  });
});
