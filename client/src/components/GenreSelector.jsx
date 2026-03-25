import React from 'react';
import { GENRES } from '../data/genres';
import './GenreSelector.css';

const GenreSelector = ({ 
  selectedGenres = [], 
  onChange, 
  maxSelections = 5
}) => {
  // Toggle genre selection
  const toggleGenre = (genreName) => {
    const isSelected = selectedGenres.includes(genreName);

    if (isSelected) {
      onChange(selectedGenres.filter(g => g !== genreName));
    } else if (selectedGenres.length < maxSelections) {
      onChange([...selectedGenres, genreName]);
    }
  };

  // Clear all selections
  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="genre-selector">
      {/* Header with selection count */}
      <div className="genre-selector-header">
        <div className="selection-info">
          <span className="selection-count">
            {selectedGenres.length}/{maxSelections} selected
          </span>
          {selectedGenres.length > 0 && (
            <button onClick={clearAll} className="clear-all-btn">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Genre Grid */}
      <div className="genre-content">
        <div className="genre-grid">
          {GENRES.map(genre => {
            const isSelected = selectedGenres.includes(genre.name);
            const isDisabled = !isSelected && selectedGenres.length >= maxSelections;

            return (
              <button
                key={genre.name}
                className={`genre-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => toggleGenre(genre.name)}
                disabled={isDisabled}
                style={{
                  borderColor: isSelected ? genre.color : undefined,
                  backgroundColor: isSelected ? `${genre.color}15` : undefined
                }}
              >
                <span className="genre-icon" style={{ color: isSelected ? 'white' : genre.color }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={genre.iconPath} />
                  </svg>
                </span>
                <span className="genre-name">{genre.name}</span>
                {isSelected && <span className="check-mark">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected genres display */}
      {selectedGenres.length > 0 && (
        <div className="selected-genres-display">
          <h4 className="selected-title">Selected Genres:</h4>
          <div className="selected-genre-chips">
            {selectedGenres.map(genreName => {
              const genreInfo = GENRES.find(g => g.name === genreName);
              const color = genreInfo ? genreInfo.color : '#666';

              return (
                <span
                  key={genreName}
                  className="genre-chip"
                  style={{ borderColor: color, backgroundColor: `${color}15` }}
                >
                  {genreInfo && (
                    <span className="chip-icon" style={{ color: color }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={genreInfo.iconPath} />
                      </svg>
                    </span>
                  )}
                  <span className="chip-text">{genreName}</span>
                  <button
                    onClick={() => toggleGenre(genreName)}
                    className="chip-remove"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Helper text */}
      {selectedGenres.length === maxSelections && (
        <div className="max-selection-notice">
          Maximum {maxSelections} genres selected. Remove one to add another.
        </div>
      )}
    </div>
  );
};

export default GenreSelector;
