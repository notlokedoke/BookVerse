import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TradeProposalModal from './TradeProposalModal';
import WishlistButton from './WishlistButton';
import { ArrowLeftRight, Pencil } from 'lucide-react';
import { formatCityName } from '../utils/formatLocation';
import { getBookImageUrl } from '../utils/imageUtils';
import './BookCard.css';

// Stable module-level helpers — defined once, not recreated per render
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const CONDITION_CLASS_MAP = {
  'new': 'condition-new',
  'like new': 'condition-like-new',
  'good': 'condition-good',
  'fair': 'condition-fair',
  'poor': 'condition-poor',
};

const getConditionClass = (condition) =>
  CONDITION_CLASS_MAP[condition?.toLowerCase()] ?? 'condition-default';

const BookCard = ({ book, showOwner = true, showEditButton = false, onEdit, showDeleteButton = false, onDelete, priority = false }) => {
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

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Handle image error
  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(true);
    e.target.src = '/placeholder-book.svg';
    e.target.onerror = null;
  };

  // Check if current user is the owner
  const isOwner = user && owner && user._id === owner._id;

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
              src={getBookImageUrl(imageUrl)}
              alt={`${title} by ${author}`}
              className="book-image"
              decoding="async"
              loading={priority ? 'eager' : 'lazy'}
              fetchpriority={priority ? 'high' : 'low'}
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
          </div>
        </Link>

        {/* Owner Info - Outside the main link to make it independently clickable */}
        {showOwner && owner && (
          <Link to={`/profile/${owner._id}`} className="book-owner-link">
            <div className="book-owner-info">
              <span className="owner-avatar">
                {owner.name?.charAt(0).toUpperCase()}
              </span>
              <span className="owner-name" title={`View ${owner.name}'s profile`}>
                {owner.name}
              </span>
            </div>
          </Link>
        )}

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
                <Pencil size={14} /> Edit
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