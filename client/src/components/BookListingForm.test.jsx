import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import BookListingForm from './BookListingForm';
import { createMockFile } from '../test/testUtils';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockUser = {
  _id: '123',
  name: 'Test User',
  email: 'test@example.com',
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

// Mock axios
vi.mock('axios');

describe('BookListingForm', () => {
  const renderBookListingForm = () =>
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BookListingForm />
      </BrowserRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all required form fields', () => {
      renderBookListingForm();

      expect(screen.getByLabelText(/book title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^author/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^condition/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^genre/i)).toBeInTheDocument();
      expect(screen.getByText(/book photos/i)).toBeInTheDocument();
    });

    it('renders optional form fields', () => {
      renderBookListingForm();

      expect(screen.getByLabelText(/^isbn$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/publication year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/publisher/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      renderBookListingForm();

      expect(screen.getByRole('button', { name: /create listing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders ISBN lookup button', () => {
      renderBookListingForm();

      expect(screen.getByRole('button', { name: /lookup/i })).toBeInTheDocument();
    });

    it('renders condition dropdown with all options', () => {
      renderBookListingForm();

      const conditionSelect = screen.getByLabelText(/^condition/i);
      expect(conditionSelect).toBeInTheDocument();
      
      const options = Array.from(conditionSelect.options).map(opt => opt.value);
      expect(options).toContain('New');
      expect(options).toContain('Like New');
      expect(options).toContain('Good');
      expect(options).toContain('Fair');
      expect(options).toContain('Poor');
    });

    it('renders genre dropdown with options', () => {
      renderBookListingForm();

      const genreSelect = screen.getByLabelText(/^genre/i);
      expect(genreSelect).toBeInTheDocument();
      
      const options = Array.from(genreSelect.options).map(opt => opt.value);
      expect(options).toContain('Fiction');
      expect(options).toContain('Mystery');
      expect(options).toContain('Science Fiction');
    });
  });

  describe('Form Validation', () => {
    it('displays validation errors for empty required fields', async () => {
      renderBookListingForm();

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/author is required/i)).toBeInTheDocument();
        expect(screen.getByText(/condition is required/i)).toBeInTheDocument();
        expect(screen.getByText(/genre is required/i)).toBeInTheDocument();
      });
    });

    it('displays validation error when no image is provided', async () => {
      renderBookListingForm();

      // Fill required fields but no image
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one image is required/i)).toBeInTheDocument();
      });
    });

    it('validates ISBN format', async () => {
      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: 'invalid-isbn' } });

      // Fill other required fields
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid isbn/i)).toBeInTheDocument();
      });
    });

    it('validates publication year range', async () => {
      renderBookListingForm();

      const yearInput = screen.getByLabelText(/publication year/i);
      fireEvent.change(yearInput, { target: { value: '999' } });

      // Fill other required fields
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/publication year must be between/i)).toBeInTheDocument();
      });
    });

    it('clears field error when user starts typing', async () => {
      renderBookListingForm();

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
  });

  describe('ISBN Lookup Functionality', () => {
    it('calls ISBN lookup API when lookup button is clicked', async () => {
      const mockBookData = {
        success: true,
        data: {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          publisher: 'Scribner',
          publicationYear: 1925,
          description: 'A classic American novel',
          thumbnail: 'https://example.com/cover.jpg',
        },
      };

      axios.post.mockResolvedValueOnce({ data: mockBookData });

      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: '9780743273565' } });

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      fireEvent.click(lookupButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/books/isbn/9780743273565')
        );
      });
    });

    it('autofills form fields with ISBN lookup data', async () => {
      const mockBookData = {
        success: true,
        data: {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          publisher: 'Scribner',
          publicationYear: 1925,
          description: 'A classic American novel',
          thumbnail: 'https://example.com/cover.jpg',
        },
      };

      axios.post.mockResolvedValueOnce({ data: mockBookData });

      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: '9780743273565' } });

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      fireEvent.click(lookupButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/book title/i)).toHaveValue('The Great Gatsby');
        expect(screen.getByLabelText(/^author/i)).toHaveValue('F. Scott Fitzgerald');
        expect(screen.getByLabelText(/publisher/i)).toHaveValue('Scribner');
        expect(screen.getByLabelText(/publication year/i)).toHaveValue(1925);
        expect(screen.getByLabelText(/description/i)).toHaveValue('A classic American novel');
      });
    });

    it('autofills form fields and shows Google Books cover after ISBN lookup', async () => {
      const mockBookData = {
        success: true,
        data: {
          title: 'Test Book',
          author: 'Test Author',
          thumbnail: 'https://example.com/cover.jpg',
        },
      };

      axios.post.mockResolvedValueOnce({ data: mockBookData });

      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: '9780743273565' } });

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      fireEvent.click(lookupButton);

      // Wait for form fields to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/book title/i)).toHaveValue('Test Book');
        expect(screen.getByLabelText(/^author/i)).toHaveValue('Test Author');
      });

      // Verify Google Books cover is shown
      await waitFor(() => {
        expect(screen.getByText(/cover image from google books will be used/i)).toBeInTheDocument();
        const preview = screen.getByAltText(/google books cover/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'https://example.com/cover.jpg');
      });
    });

    it('displays error message when ISBN lookup fails', async () => {
      axios.post.mockRejectedValueOnce({
        request: {},
      });

      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: '1234567890' } });

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      fireEvent.click(lookupButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to connect to book lookup service/i)).toBeInTheDocument();
      });
    });

    it('disables lookup button when ISBN is empty', () => {
      renderBookListingForm();

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      expect(lookupButton).toBeDisabled();
    });

    it('shows loading state during ISBN lookup', async () => {
      axios.post.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true, data: {} } }), 100))
      );

      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: '9780743273565' } });

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      fireEvent.click(lookupButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /looking up/i })).toBeInTheDocument();
      });
    });

    it('requires ISBN input before lookup', async () => {
      renderBookListingForm();

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      
      // Button should be disabled when ISBN is empty
      expect(lookupButton).toBeDisabled();
    });
  });

  describe('Image Upload Preview', () => {
    it('displays front image preview after file selection', async () => {
      renderBookListingForm();

      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        result: 'data:image/jpeg;base64,mockbase64',
      };
      global.FileReader = vi.fn(() => mockFileReader);

      fireEvent.change(frontImageInput, { target: { files: [file] } });

      // Trigger onload
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mockbase64' } });

      await waitFor(() => {
        const preview = screen.getByAltText(/front preview/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64');
      });
    });

    it('displays back image preview after file selection', async () => {
      renderBookListingForm();

      const file = createMockFile('back.jpg', 'image/jpeg', 1024);
      const backImageInput = screen.getByLabelText(/back photo/i);

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        result: 'data:image/jpeg;base64,mockbase64',
      };
      global.FileReader = vi.fn(() => mockFileReader);

      fireEvent.change(backImageInput, { target: { files: [file] } });

      // Trigger onload
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mockbase64' } });

      await waitFor(() => {
        const preview = screen.getByAltText(/back preview/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64');
      });
    });

    it('validates image file type', async () => {
      renderBookListingForm();

      const file = createMockFile('document.pdf', 'application/pdf', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);

      fireEvent.change(frontImageInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
      });
    });

    it('validates image file size (max 3MB)', async () => {
      renderBookListingForm();

      const file = createMockFile('large.jpg', 'image/jpeg', 4 * 1024 * 1024); // 4MB
      const frontImageInput = screen.getByLabelText(/front photo/i);

      fireEvent.change(frontImageInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/image file must be less than 3mb/i)).toBeInTheDocument();
      });
    });

    it('displays Google Books cover preview after ISBN lookup', async () => {
      const mockBookData = {
        success: true,
        data: {
          title: 'Test Book',
          author: 'Test Author',
          thumbnail: 'https://books.google.com/cover.jpg',
        },
      };

      axios.post.mockResolvedValueOnce({ data: mockBookData });

      renderBookListingForm();

      const isbnInput = screen.getByLabelText(/^isbn$/i);
      fireEvent.change(isbnInput, { target: { value: '9780743273565' } });

      const lookupButton = screen.getByRole('button', { name: /lookup/i });
      fireEvent.click(lookupButton);

      await waitFor(() => {
        // Check that the Google Books image is stored in form data
        expect(screen.getByText(/cover image from google books will be used/i)).toBeInTheDocument();
      });

      // Verify the preview is shown
      await waitFor(() => {
        const preview = screen.getByAltText(/google books cover/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'https://books.google.com/cover.jpg');
      });
    });

    it('clears image error when valid file is selected', async () => {
      renderBookListingForm();

      // First, trigger validation error
      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one image is required/i)).toBeInTheDocument();
      });

      // Now upload a valid file
      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
      };
      global.FileReader = vi.fn(() => mockFileReader);

      fireEvent.change(frontImageInput, { target: { files: [file] } });

      // Trigger onload to set the preview
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mockbase64' } });

      // Now submit again - the error should be gone because we have an image
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/at least one image is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            _id: '123',
            title: 'Test Book',
            author: 'Test Author',
          },
        },
      });

      renderBookListingForm();

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      // Upload image
      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
      };
      global.FileReader = vi.fn(() => mockFileReader);
      
      fireEvent.change(frontImageInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/books'),
          expect.any(FormData),
          expect.objectContaining({
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        );
      });
    });

    it('displays success message after successful submission', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { _id: '123' },
        },
      });

      renderBookListingForm();

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);
      const mockFileReader = { readAsDataURL: vi.fn(), onload: null };
      global.FileReader = vi.fn(() => mockFileReader);
      fireEvent.change(frontImageInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/book listing created successfully/i)).toBeInTheDocument();
      });
    });

    it('redirects to profile page after successful submission', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { _id: '123' },
        },
      });

      renderBookListingForm();

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);
      const mockFileReader = { readAsDataURL: vi.fn(), onload: null };
      global.FileReader = vi.fn(() => mockFileReader);
      fireEvent.change(frontImageInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      }, { timeout: 3000 });
    });

    it('displays error message on submission failure', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              message: 'Failed to create listing',
            },
          },
        },
      });

      renderBookListingForm();

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);
      const mockFileReader = { readAsDataURL: vi.fn(), onload: null };
      global.FileReader = vi.fn(() => mockFileReader);
      fireEvent.change(frontImageInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create listing/i)).toBeInTheDocument();
      });
    });

    it('disables submit button while submitting', async () => {
      axios.post.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true, data: {} } }), 100))
      );

      renderBookListingForm();

      // Fill form
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);
      const mockFileReader = { readAsDataURL: vi.fn(), onload: null };
      global.FileReader = vi.fn(() => mockFileReader);
      fireEvent.change(frontImageInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/creating listing/i);
      });
    });

    it('handles network errors gracefully', async () => {
      axios.post.mockRejectedValueOnce({
        request: {},
      });

      renderBookListingForm();

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/book title/i), { target: { value: 'Test Book' } });
      fireEvent.change(screen.getByLabelText(/^author/i), { target: { value: 'Test Author' } });
      fireEvent.change(screen.getByLabelText(/^condition/i), { target: { value: 'Good' } });
      fireEvent.change(screen.getByLabelText(/^genre/i), { target: { value: 'Fiction' } });

      const file = createMockFile('front.jpg', 'image/jpeg', 1024);
      const frontImageInput = screen.getByLabelText(/front photo/i);
      const mockFileReader = { readAsDataURL: vi.fn(), onload: null };
      global.FileReader = vi.fn(() => mockFileReader);
      fireEvent.change(frontImageInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('navigates to profile page when cancel is clicked', () => {
      renderBookListingForm();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });
});
