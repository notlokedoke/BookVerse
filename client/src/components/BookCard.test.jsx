import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookCard from './BookCard';
import { vi } from 'vitest';

// Mock data
const mockBook = {
  _id: '507f1f77bcf86cd799439011',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  condition: 'Good',
  genre: 'Classic Fiction',
  imageUrl: 'https://example.com/book-image.jpg',
  createdAt: '2025-01-01T10:00:00Z',
  owner: {
    _id: '507f191e810c19729de860ea',
    name: 'John Doe',
    city: 'New York',
    averageRating: 4.5,
    privacySettings: {
      showCity: true
    }
  }
};

const mockBookWithoutOwner = {
  _id: '507f1f77bcf86cd799439012',
  title: 'To Kill a Mockingbird',
  author: 'Harper Lee',
  condition: 'Like New',
  genre: 'Fiction',
  imageUrl: 'https://example.com/book-image2.jpg',
  createdAt: '2025-01-02T10:00:00Z'
};

const mockBookWithPrivateCity = {
  ...mockBook,
  owner: {
    ...mockBook.owner,
    privacySettings: {
      showCity: false
    }
  }
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('BookCard', () => {
  test('renders book information correctly', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('by F. Scott Fitzgerald')).toBeInTheDocument();
    expect(screen.getByText('Classic Fiction')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Listed Jan 1, 2025')).toBeInTheDocument();
  });

  test('renders book image with correct alt text', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    const image = screen.getByAltText('The Great Gatsby by F. Scott Fitzgerald');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/book-image.jpg');
  });

  test('renders owner information when showOwner is true', () => {
    renderWithRouter(<BookCard book={mockBook} showOwner={true} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('📍 New York')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  test('does not render owner information when showOwner is false', () => {
    renderWithRouter(<BookCard book={mockBook} showOwner={false} />);
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('📍 New York')).not.toBeInTheDocument();
  });

  test('does not render owner information when book has no owner', () => {
    renderWithRouter(<BookCard book={mockBookWithoutOwner} />);
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('hides city when privacy setting is false', () => {
    renderWithRouter(<BookCard book={mockBookWithPrivateCity} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('📍 New York')).not.toBeInTheDocument();
  });

  test('does not render rating when owner has no rating', () => {
    const bookWithoutRating = {
      ...mockBook,
      owner: {
        ...mockBook.owner,
        averageRating: 0
      }
    };
    
    renderWithRouter(<BookCard book={bookWithoutRating} />);
    
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  test('creates correct links for book detail and owner profile', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    const bookLink = screen.getByRole('link', { name: /the great gatsby/i });
    expect(bookLink).toHaveAttribute('href', '/books/507f1f77bcf86cd799439011');
    
    const ownerLink = screen.getByRole('link', { name: /john doe/i });
    expect(ownerLink).toHaveAttribute('href', '/profile/507f191e810c19729de860ea');
  });

  test('applies correct condition class', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    const conditionBadge = screen.getByText('Good');
    expect(conditionBadge).toHaveClass('condition-good');
  });

  test('handles different condition values', () => {
    const conditions = [
      { condition: 'New', expectedClass: 'condition-new' },
      { condition: 'Like New', expectedClass: 'condition-like-new' },
      { condition: 'Fair', expectedClass: 'condition-fair' },
      { condition: 'Poor', expectedClass: 'condition-poor' }
    ];

    conditions.forEach(({ condition, expectedClass }) => {
      const bookWithCondition = { ...mockBook, condition };
      const { unmount } = renderWithRouter(<BookCard book={bookWithCondition} />);
      
      const conditionBadge = screen.getByText(condition);
      expect(conditionBadge).toHaveClass(expectedClass);
      
      unmount();
    });
  });

  test('returns null when book is not provided', () => {
    const { container } = renderWithRouter(<BookCard book={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('handles missing createdAt gracefully', () => {
    const bookWithoutDate = { ...mockBook };
    delete bookWithoutDate.createdAt;
    
    renderWithRouter(<BookCard book={bookWithoutDate} />);
    
    expect(screen.queryByText(/listed/i)).not.toBeInTheDocument();
  });

  test('truncates long titles and authors appropriately', () => {
    const bookWithLongTitle = {
      ...mockBook,
      title: 'This is a very long book title that should be truncated when displayed in the card component',
      author: 'This is a very long author name that should also be truncated appropriately'
    };
    
    renderWithRouter(<BookCard book={bookWithLongTitle} />);
    
    // The text should still be present even if visually truncated
    expect(screen.getByText(bookWithLongTitle.title)).toBeInTheDocument();
    expect(screen.getByText(`by ${bookWithLongTitle.author}`)).toBeInTheDocument();
  });
});