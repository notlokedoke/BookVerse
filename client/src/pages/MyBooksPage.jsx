import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import axios from 'axios';
import './MyBooksPage.css';

const MyBooksPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || ''}/api/books/user/${user._id}`
        );
        
        if (response.data.success) {
          setBooks(response.data.data.books || []);
        } else {
          setError('Failed to fetch your books');
        }
      } catch (err) {
        console.error('Error fetching user books:', err);
        setError(
          err.response?.data?.error?.message || 
          'An error occurred while fetching your books'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserBooks();
  }, [user]);

  if (loading) {
    return (
      <div className="my-books-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your books...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-books-page">
        <div className="container">
          <div className="error-state">
            <h2>Error Loading Books</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-books-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>My Books</h1>
            <p className="header-subtitle">
              Manage your book listings and track your inventory
            </p>
          </div>
          <Link to="/books/create" className="create-listing-btn">
            <span className="btn-icon">+</span>
            Create New Listing
          </Link>
        </div>

        {/* Books Count */}
        <div className="books-summary">
          <div className="books-count">
            <span className="count-number">{books.length}</span>
            <span className="count-label">
              {books.length === 1 ? 'Book Listed' : 'Books Listed'}
            </span>
          </div>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <div className="books-grid">
            {books.map((book) => (
              <BookCard 
                key={book._id} 
                book={book} 
                showOwner={false} // Don't show owner info since these are user's own books
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Books Listed Yet</h3>
            <p>
              Start building your library by creating your first book listing.
              Share your books with the community and discover new reads!
            </p>
            <Link to="/books/create" className="create-first-listing-btn">
              Create Your First Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;