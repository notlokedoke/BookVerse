import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookGrid from '../components/BookGrid';
import SearchFilters from '../components/SearchFilters';
import GenreSidebar from '../components/GenreSidebar';
import { Search, Sparkles, TrendingUp, Filter } from 'lucide-react';
import './BrowsePage.css';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
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

  const debounceRef = useRef(null);

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
        limit: '25'
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
        const fetchedBooks = data.data.books;
        const paginationData = data.data.pagination;
        
        // If current page is empty and we're not on page 1, redirect to last valid page
        if (fetchedBooks.length === 0 && page > 1 && paginationData.totalPages > 0) {
          const lastValidPage = Math.min(page - 1, paginationData.totalPages);
          updateURLParams(currentFilters, lastValidPage);
          fetchBooks(lastValidPage, currentFilters);
          return;
        }
        
        // If current page exceeds total pages, go to last page
        if (page > paginationData.totalPages && paginationData.totalPages > 0) {
          updateURLParams(currentFilters, paginationData.totalPages);
          fetchBooks(paginationData.totalPages, currentFilters);
          return;
        }
        
        setBooks(fetchedBooks);
        setPagination(paginationData);
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

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    setFilters(newFilters);

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API call and URL update
    debounceRef.current = setTimeout(() => {
      // Update URL parameters and reset to page 1 when filters change
      updateURLParams(newFilters, 1);
      fetchBooks(1, newFilters);
    }, 500);
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

  // Skeleton loading state
  if (loading && books.length === 0) {
    return (
      <div className="browse-page">
        <div className="browse-container">
          <div className="browse-skeleton">
            <div className="skeleton-banner"></div>
            <div className="skeleton-filters"></div>
            <div className="skeleton-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-container">
        {/* Guest Banner */}
        {!isAuthenticated && (
          <div className="guest-banner glass-card">
            <div className="banner-icon">
              <Sparkles size={32} />
            </div>
            <div className="banner-content">
              <h3>Welcome to BookVerse!</h3>
              <p>You're browsing as a guest. Sign up to propose trades and connect with book owners.</p>
            </div>
            <div className="banner-actions">
              <Link to="/register" className="banner-btn primary">
                Sign Up Free
              </Link>
              <Link to="/login" className="banner-btn secondary">
                Log In
              </Link>
            </div>
          </div>
        )}

        {/* Header Section */}
        <section className="browse-header">
          <div className="header-icon-container">
            <Search size={28} />
          </div>
          <div className="header-text">
            <h1>Discover Books</h1>
            <p className="header-subtitle">
              <TrendingUp size={14} />
              {pagination.totalBooks} books available for trade
            </p>
          </div>
        </section>

        {/* Search & Filters Section */}
        <section className="filters-section-wrapper">
          <h2 className="filters-section-heading">Search</h2>
          <div className="filters-section glass-card">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              resultsCount={pagination.totalBooks}
              loading={loading}
            />
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-btn-bottom">
                Clear All
              </button>
            )}
          </div>
        </section>

        {/* Main Content with Sidebar */}
        <div className="browse-content-layout">
          {/* Left Sidebar - Genre Filter */}
          <aside className="browse-sidebar">
            <GenreSidebar
              selectedGenre={filters.genre}
              onChange={(genre) => handleFilterChange('genre', genre)}
            />
          </aside>

          {/* Main Content - Book Grid */}
          <main className="browse-main-content">
            <BookGrid
              books={books}
              loading={loading}
              error={error}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;