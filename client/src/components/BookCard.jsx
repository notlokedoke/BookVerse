import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TradeProposalModal from './TradeProposalModal';
import WishlistButton from './WishlistButton';
import { ArrowLeftRight } from 'lucide-react';
import { formatCityName } from '../utils/formatLocation';
import './BookCard.css';

const BookCard = ({ book, showOwner = true, showEditButton = false, onEdit, showDeleteButton = false, onDelete }) => {
  const { isAuthenticated, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
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

  // Open Library images work directly - no proxy needed!
  const getImageUrl = (url) => {
    return url || '/placeholder-book.svg';
  };

  // Handle image load
  const handleImageLoad = (e) => {
    setImageLoaded(true);
  };

  // Handle image error
  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(true); // Stop showing skeleton
    e.target.src = '/placeholder-book.svg';
  };

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
              src={getImageUrl(imageUrl)}
              alt={`${title} by ${author}`}
              className="book-image"
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
            {!imageLoaded && !imageError && (
              <div className="book-image-skeleton"></div>
            )}
            <div className={`condition-badge ${getConditionClass(condition)}`}>
              {condition}
            </div>

            {/* In Library Badge for Owner's Books */}
            {isOwner && (
              <div className="in-library-badge">
                In Library
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
            {owner && (
              <p className="book-owner-name" title={`Listed by ${owner.username}`}>
                {owner.username}
              </p>
            )}
          </div>
        </Link>

        {/* Propose Trade Button for Available Books */}
        {isAuthenticated && !isOwner && isAvailable && (
          <div className="book-actions">
            <button 
              className="propose-trade-btn"
              onClick={handleProposeTrade}
              title="Propose a trade for this book"
            >
              <ArrowLeftRight size={16} />
              Propose Trade
            </button>
          </div>
        )}

        {/* Wishlist Button Only for Unavailable Books */}
        {isAuthenticated && !isOwner && !isAvailable && (
          <div className="book-actions">
            <WishlistButton book={book} compact={false} showLabel={true} />
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