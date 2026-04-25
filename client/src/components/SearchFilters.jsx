import React from 'react';
import { Search, MapPin, BookOpen, User, X } from 'lucide-react';
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
    </div>
  );
};

export default SearchFilters;