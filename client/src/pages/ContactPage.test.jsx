import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContactPage from './ContactPage';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>
}));

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the contact page with title', () => {
    renderWithRouter(<ContactPage />);
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText(/Have questions or feedback/)).toBeInTheDocument();
  });

  it('displays contact form with all fields', () => {
    renderWithRouter(<ContactPage />);
    
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });

  it('displays contact information section', () => {
    renderWithRouter(<ContactPage />);
    
    expect(screen.getByText('Other Ways to Reach Us')).toBeInTheDocument();
    expect(screen.getByText('kandelkushal101@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Within 24-48 hours')).toBeInTheDocument();
  });

  it('displays links to help resources', () => {
    renderWithRouter(<ContactPage />);
    
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    const helpLink = screen.getByRole('link', { name: /Help Center/i });
    const aboutLink = screen.getByRole('link', { name: /About BookVerse/i });
    const safetyLink = screen.getByRole('link', { name: /Safety Guidelines/i });
    
    expect(helpLink).toHaveAttribute('href', '/help');
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(safetyLink).toHaveAttribute('href', '/safety');
  });

  it('validates required fields', async () => {
    renderWithRouter(<ContactPage />);
    
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
      expect(screen.getByText('Message is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithRouter(<ContactPage />);
    
    const nameInput = screen.getByLabelText(/Name/);
    const emailInput = screen.getByLabelText(/Email/);
    const subjectSelect = screen.getByLabelText(/Subject/);
    const messageInput = screen.getByLabelText(/Message/);
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    
    // Fill in all fields except email with valid data
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(subjectSelect, { target: { value: 'general' } });
    fireEvent.change(messageInput, { target: { value: 'This is a test message.' } });
    fireEvent.submit(submitButton.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates message minimum length', async () => {
    renderWithRouter(<ContactPage />);
    
    const messageInput = screen.getByLabelText(/Message/);
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    
    fireEvent.change(messageInput, { target: { value: 'Short' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Thank you for contacting us!'
      }
    });
    
    renderWithRouter(<ContactPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'This is a test message with enough characters.' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);
    
    // Wait for the API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/contact', {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'general',
        message: 'This is a test message with enough characters.'
      });
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Thank you! Your message has been sent successfully/)).toBeInTheDocument();
    });
  });

  it('displays error message on submission failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'Failed to submit contact form'
          }
        }
      }
    });
    
    renderWithRouter(<ContactPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'This is a test message.' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit contact form')).toBeInTheDocument();
    });
  });

  it('clears field errors when user starts typing', async () => {
    renderWithRouter(<ContactPage />);
    
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    
    // Start typing in the name field
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithRouter(<ContactPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'This is a test message.' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);
    
    // Button should be disabled and show "Sending..."
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });

  it('displays all subject options', () => {
    renderWithRouter(<ContactPage />);
    
    const subjectSelect = screen.getByLabelText(/Subject/);
    const options = subjectSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(7); // Including the default "Select a subject" option
    expect(options[1]).toHaveTextContent('General Inquiry');
    expect(options[2]).toHaveTextContent('Technical Support');
    expect(options[3]).toHaveTextContent('Feedback');
    expect(options[4]).toHaveTextContent('Report an Issue');
    expect(options[5]).toHaveTextContent('Partnership Opportunity');
    expect(options[6]).toHaveTextContent('Other');
  });
});
