import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SearchFilters from './SearchFilters';

describe('SearchFilters', () => {
  const defaultProps = {
    filters: {
      city: '',
      genre: '',
      author: ''
    },
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
    hasActiveFilters: false,
    resultsCount: 0,
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all filter inputs', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Genre')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
  });

  test('displays filter values correctly', () => {
    const filtersWithValues = {
      city: 'New York',
      genre: 'Fiction',
      author: 'Jane Doe'
    };

    render(<SearchFilters {...defaultProps} filters={filtersWithValues} />);

    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fiction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });

  test('calls onFilterChange when city input changes', () => {
    render(<SearchFilters {...defaultProps} />);

    const cityInput = screen.getByLabelText('City');
    fireEvent.change(cityInput, { target: { value: 'Boston' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('city', 'Boston');
  });

  test('calls onFilterChange when genre input changes', () => {
    render(<SearchFilters {...defaultProps} />);

    const genreInput = screen.getByLabelText('Genre');
    fireEvent.change(genreInput, { target: { value: 'Mystery' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('genre', 'Mystery');
  });

  test('calls onFilterChange when author input changes', () => {
    render(<SearchFilters {...defaultProps} />);

    const authorInput = screen.getByLabelText('Author');
    fireEvent.change(authorInput, { target: { value: 'John Smith' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('author', 'John Smith');
  });

  test('shows clear filters button when filters are active', () => {
    render(<SearchFilters {...defaultProps} hasActiveFilters={true} />);

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  test('hides clear filters button when no filters are active', () => {
    render(<SearchFilters {...defaultProps} hasActiveFilters={false} />);

    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
  });

  test('calls onClearFilters when clear button is clicked', () => {
    render(<SearchFilters {...defaultProps} hasActiveFilters={true} />);

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });

  test('displays results count correctly', () => {
    render(<SearchFilters {...defaultProps} resultsCount={25} />);

    expect(screen.getByText('25 books found')).toBeInTheDocument();
  });

  test('displays singular form for single result', () => {
    render(<SearchFilters {...defaultProps} resultsCount={1} />);

    expect(screen.getByText('1 book found')).toBeInTheDocument();
  });

  test('displays filtered indicator when filters are active', () => {
    render(<SearchFilters {...defaultProps} resultsCount={10} hasActiveFilters={true} />);

    expect(screen.getByText('10 books found (filtered)')).toBeInTheDocument();
  });

  test('displays no books found message when results count is zero', () => {
    render(<SearchFilters {...defaultProps} resultsCount={0} />);

    expect(screen.getByText('No books found')).toBeInTheDocument();
  });

  test('hides results summary when loading', () => {
    render(<SearchFilters {...defaultProps} loading={true} resultsCount={10} />);

    expect(screen.queryByText('10 books found')).not.toBeInTheDocument();
  });
});