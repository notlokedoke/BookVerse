import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TradeProposalModal from './TradeProposalModal';
import './BookCard.css';

const BookCard = ({ book, showOwner = true, showEditButton = false, onEdit, showDeleteButton = false, onDelete }) => {
  const { isAuthenticated, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    createdAt,
    isAvailable
  } = book;

  // Check if current user is the owner
  const isOwner = user && owner && user._id === owner._id;

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

  // Handle propose trade button click
  const handleProposeTrade = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
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

            {/* Quick Action Overlay - Only show for authenticated non-owners */}
            {isAuthenticated && !isOwner && isAvailable && (
              <div className="quick-action-overlay">
                <button 
                  className="quick-trade-btn"
                  onClick={handleProposeTrade}
                  title="Propose a trade for this book"
                >
                  <span className="trade-icon">🔄</span>
                  Propose Trade
                </button>
              </div>
            )}

            {/* Not Available Overlay */}
            {!isAvailable && (
              <div className="unavailable-overlay">
                <span className="unavailable-badge">Not Available</span>
              </div>
            )}
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
            {isAuthenticated ? (
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
            ) : (
              <div className="owner-info-guest">
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
              </div>
            )}
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

      {/* Trade Proposal Modal */}
      {isAuthenticated && !isOwner && (
        <TradeProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          requestedBook={book}
        />
      )}
    </>
  );
};

export default BookCard;