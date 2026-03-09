import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import SignUp from './SignUp';

// Mock axios
vi.mock('axios');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock CitySelector component
vi.mock('./common/CitySelector', () => ({
  default: ({ value, onChange, onBlur, error, disabled, required, placeholder }) => (
    <div className="city-selector-mock">
      <label htmlFor="city">City or Region</label>
      <input
        type="text"
        id="city"
        name="city"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={error ? 'error' : ''}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  ),
}));

describe('SignUp Component', () => {
  const renderSignUp = () =>
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SignUp />
      </BrowserRouter>
    );

  const getPasswordInput = () => screen.getByLabelText(/^password$/i, { selector: 'input' });
  const getConfirmPasswordInput = () => screen.getByLabelText(/confirm password/i, { selector: 'input' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      renderSignUp();

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city or region/i)).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders terms and conditions checkbox', () => {
      renderSignUp();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText(/i agree to the terms of service and privacy policy/i)).toBeInTheDocument();
    });

    it('renders social sign up button', () => {
      renderSignUp();

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });

    it('renders links to login page', () => {
      renderSignUp();

      const loginLink = screen.getByText(/already have an account\? sign in/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  describe('Validation', () => {
    it('displays validation errors for empty fields', async () => {
      renderSignUp();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/city or region is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('displays validation error for invalid email format', async () => {
      renderSignUp();

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for short password', async () => {
      renderSignUp();

      const passwordInput = getPasswordInput();
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      });
    });

    it('displays validation error when passwords do not match', async () => {
      renderSignUp();

      const passwordInput = getPasswordInput();
      const confirmPasswordInput = getConfirmPasswordInput();

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('displays validation error when terms are not agreed', async () => {
      renderSignUp();

      // Fill all fields correctly
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });

      // Don't check the terms checkbox
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/you must agree to the terms of service and privacy policy/i)).toBeInTheDocument();
      });
    });

    it('validates city field with minimum length', async () => {
      renderSignUp();

      const cityInput = screen.getByLabelText(/city or region/i);
      fireEvent.change(cityInput, { target: { value: 'A' } });
      fireEvent.blur(cityInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid city or region/i)).toBeInTheDocument();
      });
    });

    it('clears field error when user starts typing', async () => {
      renderSignUp();

      const nameInput = screen.getByLabelText(/full name/i);
      
      // Trigger validation error first
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Now type to clear the error
      fireEvent.change(nameInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('validates fields on blur', async () => {
      renderSignUp();

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true }
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

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
      }, { timeout: 2000 });
    });

    it('displays success message on successful registration', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true }
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('redirects to login page after successful registration', async () => {
      vi.useFakeTimers();
      axios.post.mockResolvedValueOnce({
        data: { success: true }
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Fast-forward time and flush promises
      await vi.advanceTimersByTimeAsync(4000);

      // Check navigation was called
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      vi.useRealTimers();
    }, 10000);

    it('disables submit button while submitting', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      axios.post.mockReturnValueOnce(promise);

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Check button is disabled while submitting
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/creating account/i);
      }, { timeout: 1000 });

      // Resolve the promise to clean up
      resolvePromise({ data: { success: true } });
    }, 10000);

    it('clears form after successful registration', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true }
      });

      renderSignUp();

      // Fill all fields
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const cityInput = screen.getByLabelText(/city or region/i);
      const passwordInput = getPasswordInput();
      const confirmPasswordInput = getConfirmPasswordInput();
      const checkbox = screen.getByRole('checkbox');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(cityInput, { target: { value: 'New York' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(checkbox);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Wait for form to be cleared
      await waitFor(() => {
        expect(nameInput).toHaveValue('');
      }, { timeout: 3000 });
      
      expect(emailInput).toHaveValue('');
      expect(cityInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
      expect(checkbox).not.toBeChecked();
    }, 10000);
  });

  describe('Error Handling', () => {
    it('displays error for duplicate email', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already exists'
            }
          }
        }
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }, 10000);

    it('displays validation errors from server', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { path: 'email', msg: 'Invalid email format' },
                { path: 'password', msg: 'Password too weak' }
              ]
            }
          }
        }
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'weak' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'weak' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
        expect(screen.getByText(/password too weak/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }, 10000);

    it('displays general error message for server errors', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              message: 'Server error occurred'
            }
          }
        }
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/server error occurred/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }, 10000);

    it('displays network error message when request fails', async () => {
      axios.post.mockRejectedValueOnce({
        request: {}
      });

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }, 10000);

    it('handles unexpected errors gracefully', async () => {
      axios.post.mockRejectedValueOnce(new Error('Unexpected error'));

      renderSignUp();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/city or region/i), { target: { value: 'New York' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }, 10000);
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility', () => {
      renderSignUp();

      const passwordInput = getPasswordInput();
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the password toggle button
      const passwordToggles = screen.getAllByLabelText(/show password|hide password/i);
      const passwordToggle = passwordToggles[0]; // First one is for password field
      fireEvent.click(passwordToggle);

      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles confirm password visibility', () => {
      renderSignUp();

      const confirmPasswordInput = getConfirmPasswordInput();
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Find and click the confirm password toggle button
      const passwordToggles = screen.getAllByLabelText(/show password|hide password/i);
      const confirmPasswordToggle = passwordToggles[1]; // Second one is for confirm password field
      fireEvent.click(confirmPasswordToggle);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      fireEvent.click(confirmPasswordToggle);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Google Sign Up', () => {
    it('redirects to Google OAuth when Google button is clicked', () => {
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      renderSignUp();

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);

      expect(window.location.href).toContain('/api/auth/google');
    });

    it('disables Google button while loading', () => {
      renderSignUp();

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);

      expect(googleButton).toBeDisabled();
      expect(googleButton).toHaveTextContent(/redirecting/i);
    });
  });
});
