import React from 'react';
import { Search, MapPin, BookOpen, User, X } from 'lucide-react';
import './SearchFilters.css';

const genreOptions = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
  'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
  'Technology', 'Health', 'Travel', 'Cooking', 'Art',
  'Poetry', 'Drama', 'Children', 'Young Adult', 'Classic', 'Other'
];

const SearchFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  resultsCount,
  loading
}) => {
  // Parse genres from string to array
  const selectedGenres = filters.genre ? filters.genre.split(',') : [];

  const handleGenreToggle = (genre) => {
    let newGenres;
    if (selectedGenres.includes(genre)) {
      // Remove genre
      newGenres = selectedGenres.filter(g => g !== genre);
    } else {
      // Add genre
      newGenres = [...selectedGenres, genre];
    }
    // Convert array back to comma-separated string
    onFilterChange('genre', newGenres.join(','));
  };

  return (
    <div className="search-filters-bar">
      <div className="filters-container">
        {/* Main Search - Title */}
        <div className="filter-input-wrapper main-search">
          <Search className="filter-icon" size={20} />
          <input
            type="text"
            placeholder="Search by book title..."
            value={filters.title || ''}
            onChange={(e) => onFilterChange('title', e.target.value)}
            className="filter-input-field"
          />
        </div>

        <div className="filter-divider"></div>

        {/* Author Filter */}
        <div className="filter-input-wrapper">
          <User className="filter-icon" size={18} />
          <input
            type="text"
            placeholder="Author"
            value={filters.author}
            onChange={(e) => onFilterChange('author', e.target.value)}
            className="filter-input-field"
          />
        </div>

        <div className="filter-divider"></div>

        {/* City Filter */}
        <div className="filter-input-wrapper">
          <MapPin className="filter-icon" size={18} />
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="filter-input-field"
          />
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="clear-icon-btn"
            title="Clear all filters"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters Heading and Genre Multi-Select */}
      <div className="genre-dropdown-panel">
        <div className="genre-tags-container">
          {genreOptions.map(genre => (
            <button
              key={genre}
              type="button"
              className={`genre-tag ${selectedGenres.includes(genre) ? 'selected' : ''}`}
              onClick={() => handleGenreToggle(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="results-badge">
          {resultsCount > 0 ? (
            <span>
              {resultsCount} book{resultsCount !== 1 ? 's' : ''} found
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