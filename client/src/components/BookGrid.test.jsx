import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookGrid from './BookGrid';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('BookGrid', () => {
  const mockPagination = {
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNextPage: false,
    hasPrevPage: false
  };

  test('displays loading state', () => {
    renderWithRouter(
      <BookGrid 
        books={[]} 
        loading={true} 
        error={null} 
        pagination={mockPagination}
        onPageChange={() => {}}
      />
    );

    // Should show loading skeleton cards
    expect(document.querySelectorAll('.loading-skeleton')).toHaveLength(8);
  });

  test('displays error state', () => {
    renderWithRouter(
      <BookGrid 
        books={[]} 
        loading={false} 
        error="Network error" 
        pagination={mockPagination}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('Unable to Load Books')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('displays empty state when no books', () => {
    renderWithRouter(
      <BookGrid 
        books={[]} 
        loading={false} 
        error={null} 
        pagination={mockPagination}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('No Books Found')).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find any books matching your search criteria/)).toBeInTheDocument();
  });

  test('displays books when provided', () => {
    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'test.jpg',
        owner: {
          _id: 'owner1',
          name: 'Owner Name',
          city: 'Test City',
          privacySettings: { showCity: true },
          averageRating: 4.5
        },
        createdAt: '2023-01-01'
      }
    ];

    renderWithRouter(
      <BookGrid 
        books={mockBooks} 
        loading={false} 
        error={null} 
        pagination={mockPagination}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
  });

  test('displays pagination when multiple pages', () => {
    const mockPaginationMultiple = {
      currentPage: 2,
      totalPages: 5,
      totalBooks: 100,
      hasNextPage: true,
      hasPrevPage: true
    };

    const mockBooks = [
      {
        _id: '1',
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'test.jpg',
        owner: {
          _id: 'owner1',
          name: 'Owner Name',
          city: 'Test City',
          privacySettings: { showCity: true },
          averageRating: 4.5
        },
        createdAt: '2023-01-01'
      }
    ];

    renderWithRouter(
      <BookGrid 
        books={mockBooks} 
        loading={false} 
        error={null} 
        pagination={mockPaginationMultiple}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });
});