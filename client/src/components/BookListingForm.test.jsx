import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import BookListingForm from './BookListingForm';
import { vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

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
  beforeEach(() => {
    mockNavigate.mockClear();
    axios.post.mockClear();
  });

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

  test('performs ISBN lookup and autofills form fields', async () => {
    const mockBookData = {
      success: true,
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publisher: 'Scribner',
        publicationYear: 1925,
        description: 'A classic American novel'
      }
    };

    axios.post.mockResolvedValueOnce({ data: mockBookData });

    renderWithProviders(<BookListingForm />);
    
    const isbnInput = screen.getByLabelText(/isbn/i);
    const lookupButton = screen.getByRole('button', { name: /lookup/i });

    // Enter ISBN and click lookup
    fireEvent.change(isbnInput, { target: { value: '9780743273565' } });
    fireEvent.click(lookupButton);

    // Wait for the API call and form update
    await waitFor(() => {
      expect(screen.getByDisplayValue('The Great Gatsby')).toBeInTheDocument();
      expect(screen.getByDisplayValue('F. Scott Fitzgerald')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Scribner')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1925')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A classic American novel')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith('/api/books/isbn/9780743273565');
  });

  test('shows error when ISBN lookup fails', async () => {
    const mockError = {
      response: {
        data: {
          error: {
            message: 'No book found with this ISBN'
          }
        }
      }
    };

    axios.post.mockRejectedValueOnce(mockError);

    renderWithProviders(<BookListingForm />);
    
    const isbnInput = screen.getByLabelText(/isbn/i);
    const lookupButton = screen.getByRole('button', { name: /lookup/i });

    // Enter ISBN and click lookup
    fireEvent.change(isbnInput, { target: { value: '9999999999999' } });
    fireEvent.click(lookupButton);

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('No book found with this ISBN')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith('/api/books/isbn/9999999999999');
  });

  test('disables lookup button when ISBN is empty', () => {
    renderWithProviders(<BookListingForm />);
    
    const lookupButton = screen.getByRole('button', { name: /lookup/i });
    
    expect(lookupButton).toBeDisabled();
  });

  test('enables lookup button when ISBN is entered', () => {
    renderWithProviders(<BookListingForm />);
    
    const isbnInput = screen.getByLabelText(/isbn/i);
    const lookupButton = screen.getByRole('button', { name: /lookup/i });

    fireEvent.change(isbnInput, { target: { value: '9780743273565' } });

    expect(lookupButton).not.toBeDisabled();
  });

  test('shows success message and redirects after successful book creation', async () => {
    const mockSuccessResponse = {
      data: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Book',
          author: 'Test Author',
          condition: 'Good',
          genre: 'Fiction'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockSuccessResponse);

    renderWithProviders(<BookListingForm />);
    
    // Fill out the form with valid data
    const titleInput = screen.getByLabelText(/book title/i);
    const authorInput = screen.getByLabelText(/author/i);
    const conditionSelect = screen.getByLabelText(/condition/i);
    const genreSelect = screen.getByLabelText(/genre/i);
    const fileInput = screen.getByLabelText(/book photo/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Test Author' } });
    fireEvent.change(conditionSelect, { target: { value: 'Good' } });
    fireEvent.change(genreSelect, { target: { value: 'Fiction' } });
    
    // Create a valid image file
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create listing/i });
    fireEvent.click(submitButton);

    // Wait for success message to appear
    await waitFor(() => {
      expect(screen.getByText(/book listing created successfully! redirecting to your profile/i)).toBeInTheDocument();
    });

    // Verify form is cleared
    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(authorInput.value).toBe('');
      expect(conditionSelect.value).toBe('');
      expect(genreSelect.value).toBe('');
    });

    // Wait for redirect (after 2 seconds)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    }, { timeout: 3000 });
  });
});