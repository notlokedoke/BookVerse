import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import BookListingForm from './BookListingForm';
import { vi } from 'vitest';

// Mock axios
vi.mock('axios');

// Mock the AuthContext
const mockAuthContext = {
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BookListingForm', () => {
  test('renders form with all required fields', () => {
    renderWithProviders(<BookListingForm />);
    
    expect(screen.getByLabelText(/book title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/book photo/i)).toBeInTheDocument();
  });

  test('shows validation errors for empty required fields', async () => {
    renderWithProviders(<BookListingForm />);
    
    const submitButton = screen.getByRole('button', { name: /create listing/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/author is required/i)).toBeInTheDocument();
      expect(screen.getByText(/condition is required/i)).toBeInTheDocument();
      expect(screen.getByText(/genre is required/i)).toBeInTheDocument();
      expect(screen.getByText(/book photo is required/i)).toBeInTheDocument();
    });
  });

  test('clears validation errors when user starts typing', async () => {
    renderWithProviders(<BookListingForm />);
    
    const submitButton = screen.getByRole('button', { name: /create listing/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/book title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });

    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  test('validates ISBN format', async () => {
    renderWithProviders(<BookListingForm />);
    
    const isbnInput = screen.getByLabelText(/isbn/i);
    fireEvent.change(isbnInput, { target: { value: 'invalid-isbn' } });
    
    const submitButton = screen.getByRole('button', { name: /create listing/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid isbn/i)).toBeInTheDocument();
    });
  });

  test('validates publication year range', async () => {
    renderWithProviders(<BookListingForm />);
    
    const yearInput = screen.getByLabelText(/publication year/i);
    fireEvent.change(yearInput, { target: { value: '999' } });
    
    const submitButton = screen.getByRole('button', { name: /create listing/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/publication year must be between/i)).toBeInTheDocument();
    });
  });
});