import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RatingCard from './RatingCard';

const mockRating = {
  _id: '1',
  stars: 4,
  comment: 'Great trade experience!',
  createdAt: new Date().toISOString(),
  rater: {
    _id: 'user1',
    name: 'John Doe',
    city: 'New York'
  }
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RatingCard', () => {
  it('renders rating with all information', () => {
    renderWithRouter(<RatingCard rating={mockRating} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Great trade experience!')).toBeInTheDocument();
  });

  it('renders correct number of stars', () => {
    const { container } = renderWithRouter(<RatingCard rating={mockRating} />);
    const stars = container.querySelectorAll('.star-icon');
    expect(stars).toHaveLength(5);
    
    const filledStars = container.querySelectorAll('.star-icon.filled');
    expect(filledStars).toHaveLength(4);
  });

  it('renders without comment when not provided', () => {
    const ratingWithoutComment = { ...mockRating, comment: null };
    renderWithRouter(<RatingCard rating={ratingWithoutComment} />);
    
    expect(screen.queryByText('Great trade experience!')).not.toBeInTheDocument();
  });

  it('renders anonymous when rater is not provided', () => {
    const ratingWithoutRater = { ...mockRating, rater: null };
    renderWithRouter(<RatingCard rating={ratingWithoutRater} />);
    
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('renders date as "Today" for current date', () => {
    renderWithRouter(<RatingCard rating={mockRating} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('returns null when rating is not provided', () => {
    const { container } = renderWithRouter(<RatingCard rating={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders rater avatar with first letter of name', () => {
    const { container } = renderWithRouter(<RatingCard rating={mockRating} />);
    const avatar = container.querySelector('.rater-avatar');
    expect(avatar).toHaveTextContent('J');
  });
});
