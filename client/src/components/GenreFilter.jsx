import React, { useState } from 'react';
import { GENRES } from '../data/genres';
import './GenreFilter.css';

const GenreFilter = ({ selectedGenre, onChange }) => {
  const clearGenre = () => {
    onChange('');
  };

  return (
    <div className="genre-filter">
      {/* Tabs - Removed, only showing Browse All */}
      <div className="genre-filter-tabs">
        <div className="tab-label">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Genres
        </div>
      </div>

      {/* Content Area */}
      <div className="genre-filter-content">
        {/* Browse All Genres */}
        <div className="genre-browser">
          <div className="all-genres-grid">
            {GENRES.map(genre => {
              const isSelected = selectedGenre === genre.name;

              return (
                <button
                  key={genre.name}
                  className={`genre-filter-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => isSelected ? clearGenre() : onChange(genre.name)}
                  style={{
                    borderColor: isSelected ? genre.color : undefined,
                    backgroundColor: isSelected ? `${genre.color}15` : undefined
                  }}
                >
                  <span className="genre-filter-icon" style={{ color: isSelected ? 'white' : genre.color }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={genre.iconPath} />
                    </svg>
                  </span>
                  <span className="genre-filter-name">{genre.name}</span>
                  {isSelected && <span className="check-mark">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Genre Display */}
      {selectedGenre && (
        <div className="selected-genre-display">
          <span className="selected-label">Filtering by:</span>
          <span className="selected-genre-badge">
            {selectedGenre}
            <button onClick={clearGenre} className="badge-remove">×</button>
          </span>
        </div>
      )}
    </div>
  );
};

export default GenreFilter;
