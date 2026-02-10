import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RatingDisplay from './RatingDisplay';

describe('RatingDisplay', () => {
  it('renders with no ratings', () => {
    render(<RatingDisplay averageRating={0} ratingCount={0} />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('(0 ratings)')).toBeInTheDocument();
  });

  it('renders with average rating and count', () => {
    render(<RatingDisplay averageRating={4.5} ratingCount={10} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(10 ratings)')).toBeInTheDocument();
  });

  it('renders singular rating text for count of 1', () => {
    render(<RatingDisplay averageRating={5.0} ratingCount={1} />);
    expect(screen.getByText('(1 rating)')).toBeInTheDocument();
  });

  it('rounds rating to 1 decimal place', () => {
    render(<RatingDisplay averageRating={3.456} ratingCount={5} />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('renders correct number of stars', () => {
    const { container } = render(<RatingDisplay averageRating={3.0} ratingCount={5} />);
    const stars = container.querySelectorAll('.star-icon');
    expect(stars).toHaveLength(5);
  });

  it('applies size class correctly', () => {
    const { container } = render(<RatingDisplay averageRating={4.0} ratingCount={5} size="lg" />);
    expect(container.querySelector('.rating-display')).toHaveClass('lg');
  });
});
