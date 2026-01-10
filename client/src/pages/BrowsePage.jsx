import React, { useState, useEffect } from 'react';
import BookGrid from '../components/BookGrid';
import SearchFilters from '../components/SearchFilters';
import './BrowsePage.css';

const BrowsePage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    city: '',
    genre: '',
    author: ''
  });

  // Fetch books from API
  const fetchBooks = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      // Add filters if they have values
      if (currentFilters.city.trim()) {
        params.append('city', currentFilters.city.trim());
      }
      if (currentFilters.genre.trim()) {
        params.append('genre', currentFilters.genre.trim());
      }
      if (currentFilters.author.trim()) {
        params.append('author', currentFilters.author.trim());
      }

      const response = await fetch(`/api/books?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBooks(data.data.books);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch books');
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err.message);
      setBooks([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalBooks: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBooks(1);
  }, []);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    setFilters(newFilters);
    
    // Reset to page 1 when filters change
    fetchBooks(1, newFilters);
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchBooks(newPage);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      city: '',
      genre: '',
      author: ''
    };
    setFilters(clearedFilters);
    fetchBooks(1, clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.city || filters.genre || filters.author;

  return (
    <div className="browse-page">
      <div className="container">
        {/* Header */}
        <div className="browse-header">
          <h1 className="browse-title">Browse Books</h1>
          <p className="browse-subtitle">
            Discover books available for trade in your community
          </p>
        </div>

        {/* Search Filters */}
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          resultsCount={pagination.totalBooks}
          loading={loading}
        />

        {/* Book Grid */}
        <BookGrid 
          books={books}
          loading={loading}
          error={error}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default BrowsePage;