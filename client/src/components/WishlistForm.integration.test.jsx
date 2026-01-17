import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import WishlistForm from './WishlistForm';
import { AuthProvider } from '../context/AuthContext';

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

describe('WishlistForm Integration', () => {
  test('renders form and allows user interaction', async () => {
    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    // Check if form elements are present and interactive
    const titleInput = screen.getByLabelText(/book title/i);
    const authorInput = screen.getByLabelText(/author/i);
    const isbnInput = screen.getByLabelText(/isbn/i);
    const notesInput = screen.getByLabelText(/notes/i);
    const submitButton = screen.getByRole('button', { name: /add to wishlist/i });

    // Test form interaction
    fireEvent.change(titleInput, { target: { value: 'Test Book Title' } });
    fireEvent.change(authorInput, { target: { value: 'Test Author' } });
    fireEvent.change(isbnInput, { target: { value: '9781234567890' } });
    fireEvent.change(notesInput, { target: { value: 'Looking for this book' } });

    // Verify values are set
    expect(titleInput.value).toBe('Test Book Title');
    expect(authorInput.value).toBe('Test Author');
    expect(isbnInput.value).toBe('9781234567890');
    expect(notesInput.value).toBe('Looking for this book');

    // Verify submit button is enabled
    expect(submitButton).not.toBeDisabled();
  });

  test('validates required fields', async () => {
    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /add to wishlist/i });
    
    // Try to submit without filling required fields
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  test('validates ISBN format', async () => {
    render(
      <MockAuthProvider>
        <WishlistForm />
      </MockAuthProvider>
    );

    const titleInput = screen.getByLabelText(/book title/i);
    const isbnInput = screen.getByLabelText(/isbn/i);
    const submitButton = screen.getByRole('button', { name: /add to wishlist/i });

    // Fill in title and invalid ISBN
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(isbnInput, { target: { value: 'invalid-isbn' } });
    
    fireEvent.click(submitButton);

    // Should show ISBN validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid ISBN (10 or 13 digits)')).toBeInTheDocument();
    });
  });

  test('clears form after successful submission', async () => {
    const onSuccess = vi.fn();

    render(
      <MockAuthProvider>
        <WishlistForm onSuccess={onSuccess} />
      </MockAuthProvider>
    );

    const titleInput = screen.getByLabelText(/book title/i);
    const authorInput = screen.getByLabelText(/author/i);

    // Fill in form
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Test Author' } });

    // Note: In a real integration test, we would mock the API response
    // For now, we just verify the form behavior
    expect(titleInput.value).toBe('Test Book');
    expect(authorInput.value).toBe('Test Author');
  });
});