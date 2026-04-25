import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BookCard from './BookCard';
import './NearbyBooks.css';

/**
 * NearbyBooks Component
 * Displays books available in the same city as the current user
 * Rebuilt from ground up for proper book display and layout
 */
function NearbyBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [userCity, setUserCity] = useState('');

  useEffect(() => {
    fetchLocalBooks();
  }, [page]);

  const fetchLocalBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/nearby/same-city', {
        params: {
          page,
          limit: 35
        }
      });

      if (response.data.success) {
        const fetchedBooks = response.data.data.books;
        const paginationData = response.data.data.pagination;
        
        // If current page is empty and we're not on page 1, redirect to last valid page
        if (fetchedBooks.length === 0 && page > 1 && paginationData.totalPages > 0) {
          const lastValidPage = Math.min(page - 1, paginationData.totalPages);
          setPage(lastValidPage);
          return; // Will trigger useEffect to fetch again
        }
        
        // If current page exceeds total pages, go to last page
        if (page > paginationData.totalPages && paginationData.totalPages > 0) {
          setPage(paginationData.totalPages);
          return; // Will trigger useEffect to fetch again
        }
        
        setBooks(fetchedBooks);
        setPagination(paginationData);
        setUserCity(response.data.data.city);
      }
    } catch (err) {
      console.error('Error fetching local books:', err);
      
      if (err.response?.data?.error?.code === 'CITY_NOT_SET') {
        setError('Please set your city in profile settings to see local books');
      } else {
        const errorMsg = err.response?.data?.error?.message || 'Failed to load local books. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    if (!pagination) return [];
    
    const pages = [];
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust range if at the beginning or end
      if (currentPage <= 3) {
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
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
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Loading State
  if (loading && books.length === 0) {
    return (
      <div className="nearby-books-container">
        <div className="nearby-books-header">
          <h1>Books from {userCity || 'Your City'}</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-text">Finding books in your city...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    const isCityError = error.includes('city') || error.includes('location');
    
    return (
      <div className="nearby-books-container">
        <div className="nearby-books-header">
          <h1>Books from {userCity || 'Your City'}</h1>
        </div>
        <div className="error-state">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="error-title">Unable to Load Books</h3>
          <p className="error-message">{error}</p>
          {isCityError && (
            <Link to="/profile-settings" className="error-action-button">
              Go to Profile Settings
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Empty State - show if no books and not loading
  if (books.length === 0 && !loading) {
    return (
      <div className="nearby-books-container">
        <div className="nearby-books-header">
          <h1>Books from {userCity || 'Your City'}</h1>
        </div>
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="empty-title">No Books Found</h3>
          <p className="empty-message">
            {page === 1 
              ? `Be the first to list a book in ${userCity}!`
              : 'This page has no books. Try going back to an earlier page.'}
          </p>
          {page === 1 ? (
            <Link to="/create-book" className="empty-action-button">
              List Your First Book
            </Link>
          ) : (
            <button onClick={() => setPage(1)} className="empty-action-button">
              Go to First Page
            </button>
          )}
        </div>
      </div>
    );
  }

  const pageNumbers = generatePageNumbers();

  // Main Content
  return (
    <div className="nearby-books-container">
      {/* Header Section */}
      <div className="nearby-books-header">
        <h1>Books from {userCity || 'Your City'}</h1>
      </div>

      {/* Books Grid */}
      <div className="books-grid">
        {books.map((book) => (
          <BookCard 
            key={book._id} 
            book={book} 
            showOwner={true}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          
          <div className="pagination-controls">
            {/* Previous Button */}
            <button
              className={`pagination-btn prev-btn ${!pagination.hasPrevPage ? 'disabled' : ''}`}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              aria-label="Previous page"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            <div className="page-numbers">
              {pageNumbers.map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    className={`page-number ${pageNum === pagination.currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={pageNum === pagination.currentPage ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>

            {/* Next Button */}
            <button
              className={`pagination-btn next-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              aria-label="Next page"
            >
              Next
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NearbyBooks;
