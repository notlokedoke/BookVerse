import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import SignUp from './SignUp';

// Mock axios
vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

const getCityInput = () =>
  screen.getByPlaceholderText(/new york, ny or greater boston area/i);

const getPasswordInput = () => screen.getByLabelText(/^password$/i, { selector: 'input' });
const getForm = () => screen.getByRole('button', { name: /create account/i }).closest('form');
const submitForm = () => fireEvent.submit(getForm());

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderWithRouter(<SignUp />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(getCityInput()).toBeInTheDocument();
    expect(screen.getByLabelText(/terms of service/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    renderWithRouter(<SignUp />);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/city.*region.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email', async () => {
    renderWithRouter(<SignUp />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for short password', async () => {
    renderWithRouter(<SignUp />);
    
    const passwordInput = getPasswordInput();
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for password mismatch', async () => {
    renderWithRouter(<SignUp />);
    
    const passwordInput = getPasswordInput();
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User registered successfully',
        data: {
          _id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          city: 'New York'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    renderWithRouter(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'john@example.com' } });
    fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(getCityInput(), { target: { value: 'New York' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    submitForm();

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          city: 'New York'
        }
      );
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('displays error for duplicate email', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          error: {
            message: 'An account with this email already exists',
            code: 'EMAIL_EXISTS'
          }
        }
      }
    };

    axios.post.mockRejectedValueOnce(mockError);

    renderWithRouter(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(getCityInput(), { target: { value: 'New York' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
    });
  });

  it('clears field error when user starts typing', async () => {
    renderWithRouter(<SignUp />);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });

  it('redirects to login page after successful registration', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User registered successfully',
        data: {
          _id: '123',
          name: 'Jane Smith',
          email: 'jane@example.com',
          city: 'Boston'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    renderWithRouter(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(getCityInput(), { target: { value: 'Boston' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    submitForm();

    // Wait for success message to appear
    await waitFor(() => {
      expect(screen.getByText(/registration successful.*check your email/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 5000 });
  });

  it('displays success confirmation message before redirect', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User registered successfully',
        data: {
          _id: '456',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          city: 'Chicago'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    renderWithRouter(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Bob Johnson' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'bob@example.com' } });
    fireEvent.change(getPasswordInput(), { target: { value: 'securepass123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'securepass123' } });
    fireEvent.change(getCityInput(), { target: { value: 'Chicago' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    submitForm();

    // Verify success message is displayed
    await waitFor(() => {
      const successMessage = screen.getByText(/registration successful.*check your email/i);
      expect(successMessage).toBeInTheDocument();
      expect(successMessage.className).toContain('success-message');
    });
  });
});
