import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import EditBookModal from '../components/EditBookModal';
import FloatingActionButton from '../components/FloatingActionButton';
import { BookOpen, Plus, Library, TrendingUp } from 'lucide-react';
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

  // Skeleton loading state
  if (loading) {
    return (
      <div className="my-books-page">
        <div className="my-books-container">
          <div className="my-books-skeleton">
            <div className="skeleton-banner"></div>
            <div className="skeleton-header"></div>
            <div className="skeleton-stats">
              <div className="skeleton-stat-card"></div>
              <div className="skeleton-stat-card"></div>
            </div>
            <div className="skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-books-page">
        <div className="my-books-container">
          <div className="error-state glass-card">
            <div className="error-icon">⚠️</div>
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
      <div className="my-books-container">
        {/* Page Header */}
        <section className="page-header">
          <div className="header-icon-container">
            <Library size={28} />
          </div>
          <div className="header-text">
            <h1>My Library</h1>
            <p className="header-subtitle">
              <TrendingUp size={14} />
              Manage your book listings and inventory
            </p>
          </div>
        </section>

        {/* Books Stats */}
        <section className="books-stats">
          <div className="stat-card gradient-purple">
            <div className="stat-icon-container">
              <BookOpen size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{books.length}</p>
              <p className="stat-label">Books Listed</p>
            </div>
          </div>
          <div className="stat-card gradient-green">
            <div className="stat-icon-container">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{books.filter(b => b.isAvailable).length}</p>
              <p className="stat-label">Available</p>
            </div>
          </div>
        </section>

        {/* Books Grid */}
        {books.length > 0 ? (
          <section className="books-section">
            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  showOwner={false}
                  showEditButton={true}
                  onEdit={handleEditBook}
                  showDeleteButton={true}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state glass-card">
            <div className="empty-illustration">
              <Library size={64} />
            </div>
            <h2>No Books Listed Yet</h2>
            <p>
              Start building your library by creating your first book listing.
              Share your books with the community and discover new reads!
            </p>
            <Link to="/books/create" className="btn-get-started">
              <Plus size={18} />
              Add Your First Book
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
            <div className="delete-confirm-modal glass-card">
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

      {/* Floating Action Button - Always visible */}
      <FloatingActionButton
        to="/books/create"
        icon={<Plus size={24} />}
        label="Add Book"
      />
    </div>
  );
};

export default MyBooksPage;