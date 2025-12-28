import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import SignUp from './SignUp';

// Mock axios
vi.mock('axios');

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };
  });

  it('renders all form fields', () => {
    render(<SignUp />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms of service/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    render(<SignUp />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/city is required/i)).toBeInTheDocument();
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email', async () => {
    render(<SignUp />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for short password', async () => {
    render(<SignUp />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for password mismatch', async () => {
    render(<SignUp />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

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

    render(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'New York' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

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

    render(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'New York' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
    });
  });

  it('clears field error when user starts typing', async () => {
    render(<SignUp />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

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

    render(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Boston' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // Wait for success message to appear
    await waitFor(() => {
      expect(screen.getByText(/registration successful.*redirecting to login/i)).toBeInTheDocument();
    });

    // Wait for redirect to happen (2 seconds + buffer)
    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    }, { timeout: 3000 });
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

    render(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Bob Johnson' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'bob@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'securepass123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'securepass123' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Chicago' } });
    fireEvent.click(screen.getByLabelText(/terms of service/i));
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // Verify success message is displayed
    await waitFor(() => {
      const successMessage = screen.getByText(/registration successful.*redirecting to login/i);
      expect(successMessage).toBeInTheDocument();
      expect(successMessage.className).toContain('success-message');
    });
  });
});
