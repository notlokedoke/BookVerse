import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, createMockBook } from './testUtils';
import { createAuthenticatedContext, createMockUser } from './mockAuthContext';
import { mockApiSuccess, mockApiError, resetApiMocks } from './mockApi';

/**
 * Example test suite demonstrating the testing infrastructure
 * 
 * This file shows how to use the various testing utilities.
 * Delete this file once you've created your actual component tests.
 */

// Mock component for demonstration
const ExampleComponent = ({ book, onSubmit }) => {
  const handleClick = () => {
    onSubmit?.();
  };

  return (
    <div>
      <h1>Example Component</h1>
      {book && (
        <div>
          <h2>{book.title}</h2>
          <p>{book.author}</p>
        </div>
      )}
      <button onClick={handleClick}>Submit</button>
    </div>
  );
};

describe('Example Test Suite', () => {
  beforeEach(() => {
    resetApiMocks();
  });

  describe('Basic Rendering', () => {
    it('renders component successfully', () => {
      renderWithProviders(<ExampleComponent />);
      
      expect(screen.getByText('Example Component')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders with mock book data', () => {
      const book = createMockBook({
        title: 'Test Book Title',
        author: 'Test Author Name',
      });

      renderWithProviders(<ExampleComponent book={book} />);

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
      expect(screen.getByText('Test Author Name')).toBeInTheDocument();
    });
  });

  describe('Authentication Context', () => {
    it('renders with authenticated user', () => {
      const user = createMockUser({ name: 'John Doe' });
      const authValue = createAuthenticatedContext({ name: 'John Doe' });

      const { authValue: contextValue } = renderWithProviders(
        <ExampleComponent />,
        { authValue }
      );

      expect(contextValue.isAuthenticated).toBe(true);
      expect(contextValue.user.name).toBe('John Doe');
    });

    it('renders without authentication', () => {
      const { authValue } = renderWithProviders(<ExampleComponent />);

      expect(authValue.isAuthenticated).toBe(false);
      expect(authValue.user).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('handles button click', () => {
      const handleSubmit = vi.fn();

      renderWithProviders(<ExampleComponent onSubmit={handleSubmit} />);

      const button = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(button);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Mocking', () => {
    it('demonstrates successful API mock', () => {
      const mockBook = createMockBook();
      mockApiSuccess.createBook(mockBook);

      // In a real test, you would trigger an API call here
      // and verify the response
      expect(mockBook.title).toBe('Test Book');
    });

    it('demonstrates error API mock', () => {
      mockApiError.validationError('Invalid input');

      // In a real test, you would trigger an API call here
      // and verify the error handling
      expect(true).toBe(true);
    });
  });

  describe('Mock Data Utilities', () => {
    it('creates mock book with defaults', () => {
      const book = createMockBook();

      expect(book).toHaveProperty('_id');
      expect(book).toHaveProperty('title');
      expect(book).toHaveProperty('author');
      expect(book).toHaveProperty('genre');
      expect(book).toHaveProperty('condition');
      expect(book.isAvailable).toBe(true);
    });

    it('creates mock book with overrides', () => {
      const book = createMockBook({
        title: 'Custom Title',
        genre: 'Mystery',
        isAvailable: false,
      });

      expect(book.title).toBe('Custom Title');
      expect(book.genre).toBe('Mystery');
      expect(book.isAvailable).toBe(false);
    });
  });
});

describe('Testing Infrastructure Verification', () => {
  it('has jest-dom matchers available', () => {
    renderWithProviders(<div>Test</div>);
    
    const element = screen.getByText('Test');
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  });

  it('has localStorage mock available', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
    
    localStorage.removeItem('test-key');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('cleans up after each test', () => {
    // This test verifies that cleanup happens automatically
    // If previous test's localStorage was cleared, this will pass
    expect(localStorage.getItem('test-key')).toBeNull();
  });
});
