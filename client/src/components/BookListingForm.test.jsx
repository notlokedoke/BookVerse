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

  test('validates image file type', async () => {
    renderWithProviders(<BookListingForm />);
    
    const fileInput = screen.getByLabelText(/book photo/i);
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
    });
  });

  test('validates image file size', async () => {
    renderWithProviders(<BookListingForm />);
    
    const fileInput = screen.getByLabelText(/book photo/i);
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/image file must be less than 5mb/i)).toBeInTheDocument();
    });
  });

  test('shows image preview when valid image is selected', async () => {
    renderWithProviders(<BookListingForm />);
    
    const fileInput = screen.getByLabelText(/book photo/i);
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      result: 'data:image/jpeg;base64,test',
      onload: null
    };
    
    global.FileReader = vi.fn(() => mockFileReader);
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    // Simulate FileReader onload
    mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } });

    await waitFor(() => {
      const previewImage = screen.getByAltText(/book preview/i);
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', 'data:image/jpeg;base64,test');
    });
  });

  test('clears image error when valid image is selected', async () => {
    renderWithProviders(<BookListingForm />);
    
    const fileInput = screen.getByLabelText(/book photo/i);
    
    // First, trigger an error with invalid file
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
    });

    // Then, select a valid file
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.queryByText(/please select a valid image file/i)).not.toBeInTheDocument();
    });
  });
});