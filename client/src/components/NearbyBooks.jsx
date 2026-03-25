import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BookCard from './BookCard';
import './NearbyBooks.css';

/**
 * LocalBooks Component (formerly NearbyBooks)
 * Displays books available in the same city as the current user
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
          limit: 20
        }
      });

      if (response.data.success) {
        setBooks(response.data.data.books);
        setPagination(response.data.data.pagination);
        setUserCity(response.data.data.city);
      }
    } catch (err) {
      console.error('Error fetching local books:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
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

  if (loading && books.length === 0) {
    return (
      <div className="nearby-books-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding books in your city...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isCityError = error.includes('city') || error.includes('location');
    
    return (
      <div className="nearby-books-container">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
          {isCityError && (
            <Link to="/profile-settings" className="error-action-button">
              Go to Profile Settings
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-books-container">
      <div className="nearby-books-header">
        <div className="header-content">
          <h1>Books in Your City</h1>
          {userCity && (
            <p className="user-location">
              <svg className="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Showing books in: <strong>{userCity}</strong>
            </p>
          )}
          <p className="feature-description">
            All books shown are available for local, in-person trades in your city
          </p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="no-results">
          <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>No books found in your city</h3>
          <p>Be the first to list a book in {userCity}!</p>
        </div>
      ) : (
        <>
          <div className="results-info">
            <p>
              Found <strong>{pagination?.totalBooks || 0}</strong> {pagination?.totalBooks === 1 ? 'book' : 'books'} in {userCity}
            </p>
          </div>

          <div className="books-grid">
            {books.map((book) => (
              <div key={book._id} className="book-card-wrapper">
                <BookCard book={book} />
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrevPage}
                className="pagination-button"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasNextPage}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NearbyBooks;
