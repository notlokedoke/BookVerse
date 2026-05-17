import React, { useMemo } from 'react';
import BookCard from './BookCard';
import useDelayedFlag from '../hooks/useDelayedFlag';
import './BookGrid.css';

const BookGrid = ({ books, loading, error, pagination, onPageChange }) => {
  const hasNoBooks = !books || books.length === 0;
  const showSkeleton = useDelayedFlag(loading && hasNoBooks, 150);

  // Loading state — only render skeleton after 150ms of waiting on an empty list
  if (loading && hasNoBooks && showSkeleton) {
    return (
      <div className="book-grid-container">
        <div className="book-grid">
          {/* Show loading skeleton cards */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="book-card loading-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-author"></div>
                <div className="skeleton-meta">
                  <div className="skeleton-genre"></div>
                  <div className="skeleton-date"></div>
                </div>
              </div>
              <div className="skeleton-owner">
                <div className="skeleton-owner-info">
                  <div className="skeleton-owner-name"></div>
                  <div className="skeleton-owner-location"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="book-grid-container">
        <div className="error-state">
          <div className="error-icon">📚</div>
          <h3 className="error-title">Unable to Load Books</h3>
          <p className="error-message">{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // While initial fetch is still in flight but skeleton suppressed — render nothing yet
  if (loading && hasNoBooks) {
    return <div className="book-grid-container" />;
  }

  // Empty state
  if (!books || books.length === 0) {
    return (
      <div className="book-grid-container">
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <h3 className="empty-title">No Books Found</h3>
          <p className="empty-message">
            We couldn't find any books matching your search criteria. 
            Try adjusting your filters or check back later for new listings.
          </p>
          <div className="empty-suggestions">
            <h4>Suggestions:</h4>
            <ul>
              <li>Clear your search filters</li>
              <li>Try searching for different genres or authors</li>
              <li>Expand your location search</li>
              <li>Check back later for new book listings</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Memoize page numbers — only recompute when pagination changes
  const pageNumbers = useMemo(() => {
    const pages = [];
    const { currentPage, totalPages } = pagination;

    if (totalPages > 0) pages.push(1);

    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    if (startPage > 2) pages.push('...');

    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }

    if (endPage < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [pagination]);

  return (
    <div className="book-grid-container">
      {/* Book Grid */}
      <div className="book-grid">
        {books.map((book, index) => (
          <BookCard
            key={book._id}
            book={book}
            showOwner={true}
            priority={index < 5}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          
          <div className="pagination-controls">
            {/* Previous Button */}
            <button
              className={`pagination-btn ${!pagination.hasPrevPage ? 'disabled' : ''}`}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              title="Previous page"
            >
              ← Previous
            </button>

            {/* Page Numbers */}
            <div className="page-numbers">
              {pageNumbers.map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      className={`page-number ${page === pagination.currentPage ? 'active' : ''}`}
                      onClick={() => onPageChange(page)}
                      title={`Go to page ${page}`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next Button */}
            <button
              className={`pagination-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              title="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookGrid;