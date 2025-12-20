import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import EditBookModal from '../components/EditBookModal';
import axios from 'axios';
import './MyBooksPage.css';

const MyBooksPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Handle edit book
  const handleEditBook = (book) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  // Handle delete book
  const handleDeleteBook = (book) => {
    setDeletingBook(book);
    setShowDeleteConfirm(true);
  };

  // Confirm delete book
  const confirmDeleteBook = async () => {
    if (!deletingBook) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL || ''}/api/books/${deletingBook._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Remove the deleted book from the books list
        setBooks(prevBooks => 
          prevBooks.filter(book => book._id !== deletingBook._id)
        );
        
        // Close confirmation dialog
        setShowDeleteConfirm(false);
        setDeletingBook(null);
      } else {
        setError('Failed to delete book');
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      setError(
        err.response?.data?.error?.message || 
        'An error occurred while deleting the book'
      );
    }
  };

  // Cancel delete book
  const cancelDeleteBook = () => {
    setShowDeleteConfirm(false);
    setDeletingBook(null);
  };

  // Handle book updated
  const handleBookUpdated = (updatedBook) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book._id === updatedBook._id ? updatedBook : book
      )
    );
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

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
                showEditButton={true} // Show edit button for user's own books
                onEdit={handleEditBook} // Pass edit handler
                showDeleteButton={true} // Show delete button for user's own books
                onDelete={handleDeleteBook} // Pass delete handler
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

        {/* Edit Book Modal */}
        <EditBookModal
          book={editingBook}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onBookUpdated={handleBookUpdated}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && deletingBook && (
          <div className="modal-overlay">
            <div className="delete-confirm-modal">
              <div className="modal-header">
                <h3>Delete Book Listing</h3>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this book listing?</p>
                <div className="book-preview">
                  <strong>"{deletingBook.title}"</strong> by {deletingBook.author}
                </div>
                <p className="warning-text">
                  This action cannot be undone. The book will be permanently removed from your listings.
                </p>
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={cancelDeleteBook}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-delete-btn"
                  onClick={confirmDeleteBook}
                >
                  Delete Book
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;