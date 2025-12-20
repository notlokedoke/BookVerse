import React from 'react';
import './SearchFilters.css';

const SearchFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  hasActiveFilters,
  resultsCount,
  loading 
}) => {
  return (
    <div className="search-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="city-filter" className="filter-label">
            City
          </label>
          <input
            id="city-filter"
            type="text"
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="genre-filter" className="filter-label">
            Genre
          </label>
          <input
            id="genre-filter"
            type="text"
            placeholder="Filter by genre..."
            value={filters.genre}
            onChange={(e) => onFilterChange('genre', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="author-filter" className="filter-label">
            Author
          </label>
          <input
            id="author-filter"
            type="text"
            placeholder="Filter by author..."
            value={filters.author}
            onChange={(e) => onFilterChange('author', e.target.value)}
            className="filter-input"
          />
        </div>

        {hasActiveFilters && (
          <div className="filter-group">
            <button
              onClick={onClearFilters}
              className="clear-filters-btn"
              title="Clear all filters"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="results-summary">
          {resultsCount > 0 ? (
            <span>
              {resultsCount} book{resultsCount !== 1 ? 's' : ''} found
              {hasActiveFilters && ' (filtered)'}
            </span>
          ) : (
            <span>No books found</span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;