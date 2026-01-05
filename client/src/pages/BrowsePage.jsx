import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookGrid from '../components/BookGrid';
import SearchFilters from '../components/SearchFilters';
import './BrowsePage.css';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
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

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    genre: searchParams.get('genre') || '',
    author: searchParams.get('author') || '',
    title: searchParams.get('title') || ''
  });

  // Update URL parameters when filters change
  const updateURLParams = (newFilters, page = 1) => {
    const params = new URLSearchParams();

    // Add page parameter
    if (page > 1) {
      params.set('page', page.toString());
    }

    // Add filter parameters if they have values
    if (newFilters.city.trim()) {
      params.set('city', newFilters.city.trim());
    }
    if (newFilters.genre.trim()) {
      params.set('genre', newFilters.genre.trim());
    }
    if (newFilters.author.trim()) {
      params.set('author', newFilters.author.trim());
    }
    if (newFilters.title.trim()) {
      params.set('title', newFilters.title.trim());
    }

    // Update URL without causing a page reload
    setSearchParams(params);
  };

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
      if (currentFilters.title.trim()) {
        params.append('title', currentFilters.title.trim());
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

  // Initial load - get page from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    fetchBooks(page);
  }, []);

  // Handle URL parameter changes (back/forward navigation, direct URL access)
  useEffect(() => {
    const urlFilters = {
      city: searchParams.get('city') || '',
      genre: searchParams.get('genre') || '',
      author: searchParams.get('author') || '',
      title: searchParams.get('title') || ''
    };

    // Only update if filters actually changed
    const filtersChanged =
      urlFilters.city !== filters.city ||
      urlFilters.genre !== filters.genre ||
      urlFilters.author !== filters.author ||
      urlFilters.title !== filters.title;

    if (filtersChanged) {
      setFilters(urlFilters);
      const page = parseInt(searchParams.get('page')) || 1;
      fetchBooks(page, urlFilters);
    }
  }, [searchParams]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    setFilters(newFilters);

    // Update URL parameters and reset to page 1 when filters change
    updateURLParams(newFilters, 1);
    fetchBooks(1, newFilters);
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // Update URL parameters with new page
      updateURLParams(filters, newPage);
      fetchBooks(newPage);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      city: '',
      genre: '',
      author: '',
      title: ''
    };
    setFilters(clearedFilters);

    // Update URL parameters and reset to page 1
    updateURLParams(clearedFilters, 1);
    fetchBooks(1, clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.city || filters.genre || filters.author || filters.title;

  return (
    <div className="browse-page">
      <div className="container">
        {/* Authentication Banner for Guests */}
        {!isAuthenticated && (
          <div className="guest-banner">
            <div className="banner-content">
              <h3>👋 Welcome to BookVerse!</h3>
              <p>You're browsing as a guest. Sign up to propose trades and connect with book owners.</p>
              <div className="banner-actions">
                <Link to="/register" className="banner-btn primary">
                  Sign Up Free
                </Link>
                <Link to="/login" className="banner-btn secondary">
                  Log In
                </Link>
              </div>
            </div>
          </div>
        )}

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