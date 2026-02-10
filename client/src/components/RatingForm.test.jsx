import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RatingForm from './RatingForm';

// Mock fetch
global.fetch = vi.fn();

describe('RatingForm', () => {
  const mockTradeId = '507f1f77bcf86cd799439011';
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
    // Set VITE_API_URL to empty string so component uses relative URLs
    import.meta.env.VITE_API_URL = '';
  });

  it('renders rating form with star selector', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    expect(screen.getByText('Your Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your experience with this trade...')).toBeInTheDocument();
  });

  it('allows user to select star rating', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    const fourStarButton = screen.getByLabelText('Rate 4 stars');
    fireEvent.click(fourStarButton);

    expect(screen.getByText('Very Good')).toBeInTheDocument();
  });

  it('shows rating text based on selected stars', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    fireEvent.click(screen.getByLabelText('Rate 1 star'));
    expect(screen.getByText('Poor')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Rate 2 stars'));
    expect(screen.getByText('Fair')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    expect(screen.getByText('Good')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Rate 4 stars'));
    expect(screen.getByText('Very Good')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Rate 5 stars'));
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows required indicator for comment when rating is 3 or lower', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    // No required indicator initially
    expect(screen.queryByText('*')).not.toBeInTheDocument();

    // Select 3 stars
    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('A comment is required for ratings of 3 stars or lower')).toBeInTheDocument();

    // Select 4 stars
    fireEvent.click(screen.getByLabelText('Rate 4 stars'));
    expect(screen.queryByText('A comment is required for ratings of 3 stars or lower')).not.toBeInTheDocument();
  });

  it('validates that star rating is selected before submission', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    const submitButton = screen.getByText('Submit Rating');
    
    // Button should be disabled when no rating is selected
    expect(submitButton).toBeDisabled();
    
    // fetch should not be called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates that comment is required for ratings of 3 stars or lower', async () => {
    render(<RatingForm tradeId={mockTradeId} />);

    // Select 3 stars
    fireEvent.click(screen.getByLabelText('Rate 3 stars'));

    // Button should be enabled now
    const submitButton = screen.getByText('Submit Rating');
    expect(submitButton).not.toBeDisabled();

    // Try to submit without comment - need to actually submit the form
    // Since we can't click a button to trigger validation without it being in a real form submit,
    // we'll trigger the form submit event directly
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Comment is required for ratings of 3 stars or lower')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows submission with high rating and no comment', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          _id: 'rating-id',
          stars: 5,
          comment: undefined
        },
        message: 'Rating submitted successfully'
      })
    });

    render(<RatingForm tradeId={mockTradeId} onSuccess={mockOnSuccess} />);

    // Select 5 stars
    fireEvent.click(screen.getByLabelText('Rate 5 stars'));

    // Submit without comment
    const submitButton = screen.getByText('Submit Rating');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/ratings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            trade: mockTradeId,
            stars: 5,
            comment: undefined
          })
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('submits rating with comment for low rating', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          _id: 'rating-id',
          stars: 2,
          comment: 'Not a great experience'
        },
        message: 'Rating submitted successfully'
      })
    });

    render(<RatingForm tradeId={mockTradeId} onSuccess={mockOnSuccess} />);

    // Select 2 stars
    fireEvent.click(screen.getByLabelText('Rate 2 stars'));

    // Enter comment
    const commentTextarea = screen.getByPlaceholderText('Share your experience with this trade...');
    fireEvent.change(commentTextarea, { target: { value: 'Not a great experience' } });

    // Submit
    const submitButton = screen.getByText('Submit Rating');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/ratings',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            trade: mockTradeId,
            stars: 2,
            comment: 'Not a great experience'
          })
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on submission failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          message: 'You have already rated this trade',
          code: 'DUPLICATE_RATING'
        }
      })
    });

    render(<RatingForm tradeId={mockTradeId} />);

    // Select rating and submit
    fireEvent.click(screen.getByLabelText('Rate 5 stars'));
    fireEvent.click(screen.getByText('Submit Rating'));

    await waitFor(() => {
      expect(screen.getByText('You have already rated this trade')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<RatingForm tradeId={mockTradeId} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit button when no rating is selected', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    const submitButton = screen.getByText('Submit Rating');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when rating is selected', () => {
    render(<RatingForm tradeId={mockTradeId} />);

    fireEvent.click(screen.getByLabelText('Rate 5 stars'));

    const submitButton = screen.getByText('Submit Rating');
    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RatingForm tradeId={mockTradeId} />);

    fireEvent.click(screen.getByLabelText('Rate 5 stars'));
    const submitButton = screen.getByText('Submit Rating');
    fireEvent.click(submitButton);

    // Check that button is disabled during loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('trims whitespace from comment before submission', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { _id: 'rating-id', stars: 3, comment: 'Good trade' }
      })
    });

    render(<RatingForm tradeId={mockTradeId} />);

    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    
    const commentTextarea = screen.getByPlaceholderText('Share your experience with this trade...');
    fireEvent.change(commentTextarea, { target: { value: '  Good trade  ' } });

    fireEvent.click(screen.getByText('Submit Rating'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/ratings',
        expect.objectContaining({
          body: JSON.stringify({
            trade: mockTradeId,
            stars: 3,
            comment: 'Good trade'
          })
        })
      );
    });
  });
});
