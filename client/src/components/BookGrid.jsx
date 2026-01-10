import React from 'react';
import BookCard from './BookCard';
import './BookGrid.css';

const BookGrid = ({ books, loading, error, pagination, onPageChange }) => {
  // Loading state
  if (loading) {
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

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;
    
    // Always show first page
    if (totalPages > 0) {
      pages.push(1);
    }
    
    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page (if different from first)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="book-grid-container">
      {/* Book Grid */}
      <div className="book-grid">
        {books.map((book) => (
          <BookCard 
            key={book._id} 
            book={book} 
            showOwner={true}
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