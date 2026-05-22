import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SearchFilters from './SearchFilters';

describe('SearchFilters', () => {
  const defaultProps = {
    filters: {
      city: '',
      author: '',
      title: ''
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

    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Author')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by book title...')).toBeInTheDocument();
  });

  test('displays filter values correctly', () => {
    const filtersWithValues = {
      city: 'New York',
      author: 'Jane Doe',
      title: ''
    };

    render(<SearchFilters {...defaultProps} filters={filtersWithValues} />);

    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });

  test('calls onFilterChange when city input changes', () => {
    render(<SearchFilters {...defaultProps} />);

    const cityInput = screen.getByPlaceholderText('City');
    fireEvent.change(cityInput, { target: { value: 'Boston' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('city', 'Boston');
  });

  test('calls onFilterChange when author input changes', () => {
    render(<SearchFilters {...defaultProps} />);

    const authorInput = screen.getByPlaceholderText('Author');
    fireEvent.change(authorInput, { target: { value: 'John Smith' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('author', 'John Smith');
  });

  test('calls onFilterChange when title input changes', () => {
    render(<SearchFilters {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Search by book title...');
    fireEvent.change(titleInput, { target: { value: 'Gatsby' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('title', 'Gatsby');
  });

  test('shows clear filters button when filters are active', () => {
    render(<SearchFilters {...defaultProps} hasActiveFilters={true} />);

    expect(screen.getByTitle('Clear all filters')).toBeInTheDocument();
  });

  test('hides clear filters button when no filters are active', () => {
    render(<SearchFilters {...defaultProps} hasActiveFilters={false} />);

    expect(screen.queryByTitle('Clear all filters')).not.toBeInTheDocument();
  });

  test('calls onClearFilters when clear button is clicked', () => {
    render(<SearchFilters {...defaultProps} hasActiveFilters={true} />);

    const clearButton = screen.getByTitle('Clear all filters');
    fireEvent.click(clearButton);

    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });
});
