import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RatingForm from './RatingForm';

// Mock fetch
global.fetch = vi.fn();

describe('RatingForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockTradeId = 'trade123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');
    global.fetch.mockClear();
  });

  const renderRatingForm = (props = {}) => {
    return render(
      <RatingForm
        tradeId={mockTradeId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('renders star rating selector', () => {
      renderRatingForm();
      
      // Should render 5 star buttons
      const starButtons = screen.getAllByRole('button', { name: /rate \d star/i });
      expect(starButtons).toHaveLength(5);
    });

    it('renders comment textarea', () => {
      renderRatingForm();
      
      expect(screen.getByLabelText(/comment/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/share your experience/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      renderRatingForm();
      
      expect(screen.getByRole('button', { name: /submit rating/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<RatingForm tradeId={mockTradeId} onSuccess={mockOnSuccess} />);
      
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Star Selection', () => {
    it('selects star rating when clicked', () => {
      renderRatingForm();
      
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      // Should show rating text
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('displays correct rating text for each star level', () => {
      renderRatingForm();
      
      const ratings = [
        { stars: 1, text: 'Poor' },
        { stars: 2, text: 'Fair' },
        { stars: 3, text: 'Good' },
        { stars: 4, text: 'Very Good' },
        { stars: 5, text: 'Excellent' }
      ];

      ratings.forEach(({ stars, text }) => {
        const starButton = screen.getByRole('button', { name: new RegExp(`rate ${stars} star`, 'i') });
        fireEvent.click(starButton);
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    });

    it('highlights stars on hover', () => {
      renderRatingForm();
      
      const fourStarButton = screen.getByRole('button', { name: /rate 4 star/i });
      fireEvent.mouseEnter(fourStarButton);
      
      // Check that the star has the active class (visual feedback)
      expect(fourStarButton).toHaveClass('active');
    });

    it('removes hover highlight when mouse leaves', () => {
      renderRatingForm();
      
      const fourStarButton = screen.getByRole('button', { name: /rate 4 star/i });
      fireEvent.mouseEnter(fourStarButton);
      fireEvent.mouseLeave(fourStarButton);
      
      // Should not have active class when not selected
      expect(fourStarButton).not.toHaveClass('active');
    });

    it('maintains selected stars after hover', () => {
      renderRatingForm();
      
      // Select 3 stars
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      // Hover over 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.mouseEnter(fiveStarButton);
      fireEvent.mouseLeave(fiveStarButton);
      
      // Should still show 3 stars selected
      expect(screen.getByText('Good')).toBeInTheDocument();
    });
  });

  describe('Conditional Comment Requirement', () => {
    it('shows required indicator for comment when rating is 3 stars or lower', () => {
      renderRatingForm();
      
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      // Should show required indicator (*)
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText(/comment is required for ratings of 3 stars or lower/i)).toBeInTheDocument();
    });

    it('does not show required indicator for comment when rating is 4 or 5 stars', () => {
      renderRatingForm();
      
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      // Should not show required indicator
      expect(screen.queryByText(/comment is required for ratings of 3 stars or lower/i)).not.toBeInTheDocument();
    });

    it('makes comment textarea required when rating is 3 stars or lower', () => {
      renderRatingForm();
      
      const twoStarButton = screen.getByRole('button', { name: /rate 2 star/i });
      fireEvent.click(twoStarButton);
      
      const commentTextarea = screen.getByLabelText(/comment/i);
      expect(commentTextarea).toBeRequired();
    });

    it('makes comment textarea optional when rating is 4 or 5 stars', () => {
      renderRatingForm();
      
      const fourStarButton = screen.getByRole('button', { name: /rate 4 star/i });
      fireEvent.click(fourStarButton);
      
      const commentTextarea = screen.getByLabelText(/comment/i);
      expect(commentTextarea).not.toBeRequired();
    });
  });

  describe('Validation', () => {
    it('shows error when submitting without selecting stars', () => {
      renderRatingForm();
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      
      // Submit button should be disabled when no stars selected
      expect(submitButton).toBeDisabled();
    });

    it('shows error when submitting low rating without comment', async () => {
      renderRatingForm();
      
      // Select 2 stars
      const twoStarButton = screen.getByRole('button', { name: /rate 2 star/i });
      fireEvent.click(twoStarButton);
      
      // Submit without comment
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.submit(submitButton.closest('form'));
      
      await waitFor(() => {
        // Check for error message specifically (not the hint)
        const errorMessages = screen.queryAllByText(/comment is required for ratings of 3 stars or lower/i);
        const errorMessage = errorMessages.find(el => el.closest('.error-message'));
        expect(errorMessage).toBeTruthy();
      });
    });

    it('allows submission of high rating without comment', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { _id: 'rating123', stars: 5 }
        })
      });

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('clears error when user selects stars', () => {
      renderRatingForm();
      
      // Submit button should be disabled initially
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      expect(submitButton).toBeDisabled();
      
      // Select stars
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      // Submit button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('clears error when user types in comment', async () => {
      renderRatingForm();
      
      // Select 2 stars and try to submit without comment
      const twoStarButton = screen.getByRole('button', { name: /rate 2 star/i });
      fireEvent.click(twoStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.submit(submitButton.closest('form'));
      
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/comment is required for ratings of 3 stars or lower/i);
        const errorMessage = errorMessages.find(el => el.closest('.error-message'));
        expect(errorMessage).toBeTruthy();
      });
      
      // Type in comment
      const commentTextarea = screen.getByLabelText(/comment/i);
      fireEvent.change(commentTextarea, { target: { value: 'This is a comment' } });
      
      // Error message should be cleared (but hint should still be visible)
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/comment is required for ratings of 3 stars or lower/i);
        const errorMessage = errorMessages.find(el => el.closest('.error-message'));
        expect(errorMessage).toBeFalsy();
      });
    });

    it('validates that comment is not just whitespace for low ratings', async () => {
      renderRatingForm();
      
      // Select 1 star
      const oneStarButton = screen.getByRole('button', { name: /rate 1 star/i });
      fireEvent.click(oneStarButton);
      
      // Enter only whitespace
      const commentTextarea = screen.getByLabelText(/comment/i);
      fireEvent.change(commentTextarea, { target: { value: '   ' } });
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.submit(submitButton.closest('form'));
      
      await waitFor(() => {
        // Check for error message specifically (not the hint)
        const errorMessages = screen.queryAllByText(/comment is required for ratings of 3 stars or lower/i);
        const errorMessage = errorMessages.find(el => el.closest('.error-message'));
        expect(errorMessage).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits rating with stars and comment', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { _id: 'rating123', stars: 3, comment: 'Good trade' }
        })
      });

      renderRatingForm();
      
      // Select 3 stars
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      // Enter comment
      const commentTextarea = screen.getByLabelText(/comment/i);
      fireEvent.change(commentTextarea, { target: { value: 'Good trade' } });
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ratings'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token',
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              trade: mockTradeId,
              stars: 3,
              comment: 'Good trade'
            })
          })
        );
      });
    });

    it('calls onSuccess callback after successful submission', async () => {
      const mockRatingData = { _id: 'rating123', stars: 5 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRatingData
        })
      });

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockRatingData);
      });
    });

    it('disables submit button while submitting', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        }), 100))
      );

      renderRatingForm();
      
      // Select 4 stars
      const fourStarButton = screen.getByRole('button', { name: /rate 4 star/i });
      fireEvent.click(fourStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      // Button should be disabled and show loading text
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/submitting/i);
      });
    });

    it('disables submit button when no stars selected', () => {
      renderRatingForm();
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when stars are selected', () => {
      renderRatingForm();
      
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('trims whitespace from comment before submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { _id: 'rating123' }
        })
      });

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      // Enter comment with whitespace
      const commentTextarea = screen.getByLabelText(/comment/i);
      fireEvent.change(commentTextarea, { target: { value: '  Great trade!  ' } });
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.comment).toBe('Great trade!');
      });
    });

    it('sends undefined for comment when empty for high ratings', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { _id: 'rating123' }
        })
      });

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.comment).toBeUndefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'You have already rated this trade' }
        })
      });

      renderRatingForm();
      
      // Select 4 stars
      const fourStarButton = screen.getByRole('button', { name: /rate 4 star/i });
      fireEvent.click(fourStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/you have already rated this trade/i)).toBeInTheDocument();
      });
    });

    it('displays generic error message when API returns no error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false
        })
      });

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to submit rating/i)).toBeInTheDocument();
      });
    });

    it('displays error message for network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderRatingForm();
      
      // Select 3 stars
      const threeStarButton = screen.getByRole('button', { name: /rate 3 star/i });
      fireEvent.click(threeStarButton);
      
      // Enter comment
      const commentTextarea = screen.getByLabelText(/comment/i);
      fireEvent.change(commentTextarea, { target: { value: 'Good trade' } });
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/unable to submit rating.*please try again/i)).toBeInTheDocument();
      });
    });

    it('displays error when no authentication token is present', async () => {
      localStorage.removeItem('token');

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', () => {
      renderRatingForm();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('disables cancel button while submitting', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        }), 100))
      );

      renderRatingForm();
      
      // Select 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 star/i });
      fireEvent.click(fiveStarButton);
      
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);
      
      // Cancel button should be disabled
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });
  });
});
