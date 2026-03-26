import React from 'react';
import { GENRES } from '../data/genres';
import './GenreSidebar.css';

const GenreSidebar = ({ selectedGenre, onChange }) => {
  return (
    <div className="genre-sidebar">
      <div className="sidebar-header">
        <h3>Genre</h3>
      </div>
      
      <div className="genre-list">
        {/* All Books Option */}
        <button
          className={`genre-item ${!selectedGenre ? 'active' : ''}`}
          onClick={() => onChange('')}
        >
          <span className="genre-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          <span className="genre-name">All Books</span>
        </button>

        {/* Genre Options */}
        {GENRES.map(genre => {
          const isSelected = selectedGenre === genre.name;
          
          return (
            <button
              key={genre.name}
              className={`genre-item ${isSelected ? 'active' : ''}`}
              onClick={() => onChange(isSelected ? '' : genre.name)}
            >
              <span className="genre-icon" style={{ color: genre.color }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={genre.iconPath} />
                </svg>
              </span>
              <span className="genre-name">{genre.name}</span>
              {isSelected && (
                <span className="check-icon">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreSidebar;
