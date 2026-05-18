# Books API - Quick Reference

Quick start guide with code examples for the BookVerse Books API.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Common Use Cases](#common-use-cases)
3. [Code Examples](#code-examples)
4. [Filter Examples](#filter-examples)
5. [Error Handling](#error-handling)

---

## Quick Start

### Base URL

```
http://localhost:5000/api/books
```

### Authentication

```javascript
// Set authorization header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## Common Use Cases

### 1. Create a Book Listing

```javascript
// With ISBN lookup first (recommended)
const isbnResponse = await axios.post(`/api/books/isbn/9780743273565`);
const bookData = isbnResponse.data.data;

// Create book with metadata
const formData = new FormData();
formData.append('title', bookData.title);
formData.append('author', bookData.author);
formData.append('condition', 'Good');
formData.append('genres', JSON.stringify(['Fiction', 'Classic']));
formData.append('isbn', bookData.isbn);
formData.append('description', bookData.description);
formData.append('googleBooksImageUrl', bookData.thumbnail);
formData.append('frontImage', frontImageFile);
formData.append('backImage', backImageFile);

const response = await axios.post('/api/books', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 2. Browse Books with Filters

```javascript
// Get books in my city
const response = await axios.get('/api/books', {
  params: {
    city: 'New York',
    page: 1,
    limit: 20
  }
});

const { books, pagination } = response.data.data;
```

### 3. Search for Specific Books

```javascript
// Search by author
const response = await axios.get('/api/books', {
  params: {
    author: 'Fitzgerald',
    genre: 'Fiction',
    page: 1
  }
});
```

### 4. Get Book Details

```javascript
// Get single book
const response = await axios.get(`/api/books/${bookId}`);
const book = response.data.data;
```

### 5. Update Book Listing

```javascript
// Update book details
const formData = new FormData();
formData.append('title', 'Updated Title');
formData.append('condition', 'Like New');
formData.append('genres', JSON.stringify(['Fiction', 'Classic', 'Romance']));

const response = await axios.put(`/api/books/${bookId}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 6. Delete Book Listing

```javascript
// Delete book
const response = await axios.delete(`/api/books/${bookId}`);
```

---

## Code Examples

### React Component - Create Book Form

```jsx
import { useState } from 'react';
import axios from 'axios';

function CreateBookForm() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    condition: 'Good',
    genres: [],
    isbn: '',
    description: ''
  });
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ISBN lookup
  const handleISBNLookup = async () => {
    if (!formData.isbn) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`/api/books/isbn/${formData.isbn}`);
      const bookData = response.data.data;
      
      setFormData(prev => ({
        ...prev,
        title: bookData.title || prev.title,
        author: bookData.author || prev.author,
        description: bookData.description || prev.description,
        googleBooksImageUrl: bookData.thumbnail
      }));
    } catch (error) {
      console.error('ISBN lookup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('condition', formData.condition);
    data.append('genres', JSON.stringify(formData.genres));
    data.append('isbn', formData.isbn);
    data.append('description', formData.description);
    
    if (formData.googleBooksImageUrl) {
      data.append('googleBooksImageUrl', formData.googleBooksImageUrl);
    }
    if (frontImage) data.append('frontImage', frontImage);
    if (backImage) data.append('backImage', backImage);

    try {
      setLoading(true);
      const response = await axios.post('/api/books', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Book created:', response.data.data);
      // Redirect or show success message
    } catch (error) {
      console.error('Failed to create book:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ISBN field with lookup button */}
      <div>
        <input
          type="text"
          placeholder="ISBN"
          value={formData.isbn}
          onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
        />
        <button type="button" onClick={handleISBNLookup} disabled={loading}>
          Lookup
        </button>
      </div>

      {/* Other form fields */}
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Author"
        value={formData.author}
        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
        required
      />

      <select
        value={formData.condition}
        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
        required
      >
        <option value="Like New">Like New</option>
        <option value="Good">Good</option>
        <option value="Fair">Fair</option>
        <option value="Poor">Poor</option>
      </select>

      {/* Image uploads */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFrontImage(e.target.files[0])}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setBackImage(e.target.files[0])}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Book'}
      </button>
    </form>
  );
}
```

### React Component - Browse Books

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function BrowseBooks() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    genre: '',
    author: '',
    page: 1,
    limit: 20
  });
  const [loading, setLoading] = useState(false);

  // Fetch books
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/books', { params: filters });
      setBooks(response.data.data.books);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="City"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
        />
        
        <input
          type="text"
          placeholder="Genre"
          value={filters.genre}
          onChange={(e) => handleFilterChange('genre', e.target.value)}
        />
        
        <input
          type="text"
          placeholder="Author"
          value={filters.author}
          onChange={(e) => handleFilterChange('author', e.target.value)}
        />
      </div>

      {/* Books grid */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <div key={book._id} className="book-card">
              <img src={book.imageUrl} alt={book.title} />
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p>Condition: {book.condition}</p>
              <p>Owner: {book.owner.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>
          
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### React Component - Book Detail

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function BookDetail() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`/api/books/${bookId}`);
        setBook(response.data.data);
      } catch (error) {
        console.error('Failed to fetch book:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  if (loading) return <p>Loading...</p>;
  if (!book) return <p>Book not found</p>;

  return (
    <div className="book-detail">
      <div className="book-images">
        <img src={book.imageUrl} alt={book.title} />
        {book.frontImageUrl && (
          <img src={book.frontImageUrl} alt="Front cover" />
        )}
        {book.backImageUrl && (
          <img src={book.backImageUrl} alt="Back cover" />
        )}
      </div>

      <div className="book-info">
        <h1>{book.title}</h1>
        <h2>by {book.author}</h2>
        
        <div className="book-details">
          <p><strong>Condition:</strong> {book.condition}</p>
          <p><strong>Genres:</strong> {book.genre.join(', ')}</p>
          {book.isbn && <p><strong>ISBN:</strong> {book.isbn}</p>}
          {book.publicationYear && (
            <p><strong>Published:</strong> {book.publicationYear}</p>
          )}
          {book.publisher && (
            <p><strong>Publisher:</strong> {book.publisher}</p>
          )}
        </div>

        {book.description && (
          <div className="book-description">
            <h3>Description</h3>
            <p>{book.description}</p>
          </div>
        )}

        <div className="owner-info">
          <h3>Owner</h3>
          <p><strong>Name:</strong> {book.owner.name}</p>
          {book.owner.city && (
            <p><strong>City:</strong> {book.owner.city}</p>
          )}
          <p><strong>Rating:</strong> {book.owner.averageRating} ⭐ ({book.owner.ratingCount} reviews)</p>
        </div>

        <button onClick={() => {/* Propose trade */}}>
          Propose Trade
        </button>
      </div>
    </div>
  );
}
```

---

## Filter Examples

### 1. City Filter

```javascript
// Books in New York
const response = await axios.get('/api/books', {
  params: { city: 'New York' }
});
```

### 2. Genre Filter

```javascript
// Fiction books
const response = await axios.get('/api/books', {
  params: { genre: 'Fiction' }
});

// Multiple genres
const response = await axios.get('/api/books', {
  params: { genre: 'Fiction,Mystery,Thriller' }
});
```

### 3. Author Filter

```javascript
// Books by Fitzgerald
const response = await axios.get('/api/books', {
  params: { author: 'Fitzgerald' }
});
```

### 4. Title Filter

```javascript
// Books with "Gatsby" in title
const response = await axios.get('/api/books', {
  params: { title: 'Gatsby' }
});
```

### 5. Combined Filters

```javascript
// Fiction books by Fitzgerald in New York
const response = await axios.get('/api/books', {
  params: {
    city: 'New York',
    genre: 'Fiction',
    author: 'Fitzgerald',
    page: 1,
    limit: 20
  }
});
```

---

## Error Handling

### Comprehensive Error Handler

```javascript
async function createBook(bookData) {
  try {
    const response = await axios.post('/api/books', bookData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    const errorData = error.response?.data?.error;
    
    // Handle specific error codes
    switch (errorData?.code) {
      case 'MISSING_REQUIRED_FIELDS':
        return {
          success: false,
          message: 'Please fill in all required fields',
          details: errorData.details
        };
      
      case 'IMAGE_REQUIRED':
        return {
          success: false,
          message: 'Please upload at least one image or use ISBN lookup'
        };
      
      case 'VALIDATION_ERROR':
        return {
          success: false,
          message: errorData.message,
          details: errorData.details
        };
      
      case 'UNAUTHORIZED':
        return {
          success: false,
          message: 'Please log in to create a book listing'
        };
      
      default:
        return {
          success: false,
          message: 'Failed to create book listing. Please try again.'
        };
    }
  }
}
```

### Error Display Component

```jsx
function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="error-message">
      <p>{error.message}</p>
      {error.details && (
        <ul>
          {error.details.map((detail, index) => (
            <li key={index}>{detail.msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Image Handling

### Using Image Proxy

```jsx
// Component to display external book covers
function BookCover({ imageUrl }) {
  // Check if it's an external URL that needs proxying
  const needsProxy = imageUrl?.includes('books.google.com') || 
                     imageUrl?.includes('covers.openlibrary.org');
  
  const displayUrl = needsProxy
    ? `/api/books/proxy-image?url=${encodeURIComponent(imageUrl)}`
    : imageUrl;

  return (
    <img
      src={displayUrl}
      alt="Book cover"
      onError={(e) => {
        e.target.src = '/placeholder-book.svg';
      }}
    />
  );
}
```

### Image Upload Preview

```jsx
function ImageUploadPreview({ file, onRemove }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <div className="image-preview">
      {preview && (
        <>
          <img src={preview} alt="Preview" />
          <button onClick={onRemove}>Remove</button>
        </>
      )}
    </div>
  );
}
```

---

## ISBN Lookup Integration

### Complete ISBN Lookup Flow

```jsx
function ISBNLookup({ onBookDataFetched }) {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async () => {
    if (!isbn) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`/api/books/isbn/${isbn}`);
      onBookDataFetched(response.data.data);
    } catch (error) {
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 'BOOK_NOT_FOUND') {
        setError('No book found with this ISBN. Please enter details manually.');
      } else if (errorCode === 'INVALID_ISBN_FORMAT') {
        setError('Invalid ISBN format. Please enter 10 or 13 digits.');
      } else {
        setError('Failed to lookup ISBN. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="isbn-lookup">
      <input
        type="text"
        placeholder="Enter ISBN (10 or 13 digits)"
        value={isbn}
        onChange={(e) => setIsbn(e.target.value)}
      />
      <button onClick={handleLookup} disabled={loading}>
        {loading ? 'Looking up...' : 'Lookup'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## Performance Tips

### 1. Implement Pagination

```javascript
// Load more books on scroll
const [page, setPage] = useState(1);
const [books, setBooks] = useState([]);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const response = await axios.get('/api/books', {
    params: { page: page + 1, limit: 20 }
  });
  
  setBooks(prev => [...prev, ...response.data.data.books]);
  setPage(prev => prev + 1);
  setHasMore(response.data.data.pagination.hasNextPage);
};
```

### 2. Cache Results

```javascript
// Simple cache implementation
const cache = new Map();

async function fetchBooks(filters) {
  const cacheKey = JSON.stringify(filters);
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 30000) { // 30 seconds
      return cached.data;
    }
  }
  
  // Fetch from API
  const response = await axios.get('/api/books', { params: filters });
  
  // Store in cache
  cache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
}
```

### 3. Lazy Load Images

```jsx
function LazyBookImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState('/placeholder-book.svg');
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} src={imageSrc} alt={alt} />;
}
```

---

## Testing

### Unit Test Example (Jest)

```javascript
describe('Books API', () => {
  let authToken;
  let bookId;

  beforeAll(async () => {
    // Login to get token
    const loginResponse = await axios.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'TestPass123'
    });
    authToken = loginResponse.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  });

  test('Create book listing', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Book');
    formData.append('author', 'Test Author');
    formData.append('condition', 'Good');
    formData.append('genres', JSON.stringify(['Fiction']));
    formData.append('googleBooksImageUrl', 'https://example.com/image.jpg');

    const response = await axios.post('/api/books', formData);
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.title).toBe('Test Book');
    
    bookId = response.data.data._id;
  });

  test('Get all books', async () => {
    const response = await axios.get('/api/books');
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data.books)).toBe(true);
  });

  test('Get single book', async () => {
    const response = await axios.get(`/api/books/${bookId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data._id).toBe(bookId);
  });

  test('Update book', async () => {
    const formData = new FormData();
    formData.append('title', 'Updated Test Book');

    const response = await axios.put(`/api/books/${bookId}`, formData);
    
    expect(response.status).toBe(200);
    expect(response.data.data.title).toBe('Updated Test Book');
  });

  test('Delete book', async () => {
    const response = await axios.delete(`/api/books/${bookId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
```

---

## Quick Debugging

### Check Book Creation

```bash
# Test with cURL
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Book" \
  -F "author=Test Author" \
  -F "condition=Good" \
  -F 'genres=["Fiction"]' \
  -F "googleBooksImageUrl=https://example.com/image.jpg"
```

### Check Filters

```bash
# Test city filter
curl "http://localhost:5000/api/books?city=New%20York"

# Test genre filter
curl "http://localhost:5000/api/books?genre=Fiction"

# Test combined filters
curl "http://localhost:5000/api/books?city=New%20York&genre=Fiction&page=1&limit=10"
```

### Check ISBN Lookup

```bash
# Test ISBN lookup
curl -X POST http://localhost:5000/api/books/isbn/9780743273565
```

---

## Related Documentation

- **[Books API](./BOOKS_API.md)** - Complete API documentation
- **[Authentication API](./AUTHENTICATION_API.md)** - Authentication endpoints
- **[Book Cover Strategy](./BOOK_COVER_STRATEGY.md)** - Image handling details

---

**Last Updated**: January 2025  
**Status**: Production Ready
