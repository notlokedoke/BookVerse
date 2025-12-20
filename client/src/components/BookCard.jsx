import React from 'react';
import { Link } from 'react-router-dom';
import './BookCard.css';

const BookCard = ({ book, showOwner = true, showEditButton = false, onEdit, showDeleteButton = false, onDelete }) => {
  if (!book) {
    return null;
  }

  const {
    _id,
    title,
    author,
    condition,
    genre,
    imageUrl,
    owner,
    createdAt
  } = book;

  // Format creation date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get condition color class
  const getConditionClass = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'new':
        return 'condition-new';
      case 'like new':
        return 'condition-like-new';
      case 'good':
        return 'condition-good';
      case 'fair':
        return 'condition-fair';
      case 'poor':
        return 'condition-poor';
      default:
        return 'condition-default';
    }
  };

  return (
    <div className="book-card">
      <Link to={`/books/${_id}`} className="book-card-link">
        {/* Book Image */}
        <div className="book-image-container">
          <img
            src={imageUrl}
            alt={`${title} by ${author}`}
            className="book-image"
            onError={(e) => {
              e.target.src = '/placeholder-book.png'; // Fallback image
            }}
          />
          <div className={`condition-badge ${getConditionClass(condition)}`}>
            {condition}
          </div>
        </div>

        {/* Book Details */}
        <div className="book-details">
          <h3 className="book-title" title={title}>
            {title}
          </h3>
          <p className="book-author" title={author}>
            by {author}
          </p>
          <div className="book-meta">
            <span className="book-genre">{genre}</span>
            {createdAt && (
              <span className="book-date">Listed {formatDate(createdAt)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Owner Information */}
      {showOwner && owner && (
        <div className="book-owner">
          <Link to={`/profile/${owner._id}`} className="owner-link">
            <div className="owner-info">
              <span className="owner-name">{owner.name}</span>
              {owner.city && owner.privacySettings?.showCity !== false && (
                <span className="owner-location">📍 {owner.city}</span>
              )}
            </div>
            {owner.averageRating > 0 && (
              <div className="owner-rating">
                <span className="rating-stars">⭐</span>
                <span className="rating-value">
                  {owner.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Edit and Delete Buttons for Owner */}
      {(showEditButton || showDeleteButton) && (onEdit || onDelete) && (
        <div className="book-actions">
          {showEditButton && onEdit && (
            <button 
              className="edit-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(book);
              }}
              title="Edit this book"
            >
              ✏️ Edit
            </button>
          )}
          {showDeleteButton && onDelete && (
            <button 
              className="delete-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(book);
              }}
              title="Delete this book"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookCard;