# Books API with Image Upload

This document explains how to use the Books API with image upload functionality using Cloudinary.

## Setup

Make sure you have the following environment variables set in your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

## API Endpoints

### Create Book Listing

**POST** `/api/books`

Creates a new book listing with image upload.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### Form Data
- `coverImage` (file, required): Image file (JPEG, PNG, GIF, WebP, max 5MB)
- `title` (string, required): Book title
- `author` (string, required): Book author
- `condition` (string, required): Book condition (New, Like New, Good, Fair, Poor)
- `genre` (string, required): Book genre
- `isbn` (string, optional): Book ISBN
- `description` (string, optional): Book description
- `publicationYear` (number, optional): Publication year
- `publisher` (string, optional): Publisher name

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "condition": "Good",
    "genre": "Classic Fiction",
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/bookverse/abc123.jpg",
    "owner": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York"
    },
    "createdAt": "2025-09-15T10:30:00Z"
  },
  "message": "Book listing created successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/bookverse/abc123.jpg",
  "imagePublicId": "bookverse/abc123"
}
```

#### Error Responses

**400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": {
    "message": "Missing required fields: title, author, condition, and genre are required",
    "code": "MISSING_REQUIRED_FIELDS"
  }
}
```

**400 Bad Request** - No image uploaded:
```json
{
  "success": false,
  "error": {
    "message": "Cover image is required for book listing",
    "code": "IMAGE_REQUIRED"
  }
}
```

**400 Bad Request** - Invalid file type:
```json
{
  "success": false,
  "error": {
    "message": "Invalid file type. Only JPEG, PNG and WebP are allowed.",
    "code": "INVALID_FILE_TYPE"
  }
}
```

**400 Bad Request** - File too large:
```json
{
  "success": false,
  "error": {
    "message": "File too large. Maximum size is 5MB.",
    "code": "FILE_TOO_LARGE"
  }
}
```

**401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": {
    "message": "Access denied. No token provided.",
    "code": "NO_TOKEN"
  }
}
```

## Frontend Usage Examples

### JavaScript/Fetch API

```javascript
const createBookListing = async (bookData, imageFile, authToken) => {
  const formData = new FormData();
  
  // Add image file
  formData.append('coverImage', imageFile);
  
  // Add book data
  formData.append('title', bookData.title);
  formData.append('author', bookData.author);
  formData.append('condition', bookData.condition);
  formData.append('genre', bookData.genre);
  
  // Add optional fields
  if (bookData.isbn) formData.append('isbn', bookData.isbn);
  if (bookData.description) formData.append('description', bookData.description);
  if (bookData.publicationYear) formData.append('publicationYear', bookData.publicationYear);
  if (bookData.publisher) formData.append('publisher', bookData.publisher);

  try {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Book created successfully:', result.data);
      return result.data;
    } else {
      console.error('Error creating book:', result.error);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Usage
const bookData = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  condition: 'Good',
  genre: 'Classic Fiction',
  description: 'A classic American novel'
};

const imageFile = document.getElementById('imageInput').files[0];
const authToken = localStorage.getItem('authToken');

createBookListing(bookData, imageFile, authToken)
  .then(book => {
    console.log('Book created:', book);
  })
  .catch(error => {
    console.error('Failed to create book:', error);
  });
```

### React Example

```jsx
import React, { useState } from 'react';

const BookListingForm = ({ authToken, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    condition: 'Good',
    genre: '',
    isbn: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = new FormData();
    submitData.append('coverImage', imageFile);
    
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        submitData.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: submitData
      });

      const result = await response.json();
      
      if (result.success) {
        onSuccess(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Cover Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          required
        />
      </div>
      
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Author:</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({...formData, author: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Condition:</label>
        <select
          value={formData.condition}
          onChange={(e) => setFormData({...formData, condition: e.target.value})}
          required
        >
          <option value="New">New</option>
          <option value="Like New">Like New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
        </select>
      </div>
      
      <div>
        <label>Genre:</label>
        <input
          type="text"
          value={formData.genre}
          onChange={(e) => setFormData({...formData, genre: e.target.value})}
          required
        />
      </div>
      
      {error && <div style={{color: 'red'}}>{error}</div>}
      
      <button type="submit" disabled={loading || !imageFile}>
        {loading ? 'Creating...' : 'Create Book Listing'}
      </button>
    </form>
  );
};

export default BookListingForm;
```

## Image Processing

The uploaded images are automatically processed by Cloudinary with the following transformations:

- **Folder**: Stored in `bookverse` folder
- **Size**: Limited to 500x500 pixels (maintains aspect ratio)
- **Formats**: Accepts JPEG, PNG, GIF, WebP
- **Quality**: Automatically optimized
- **File Size**: Maximum 5MB

## Testing

Run the upload tests with:

```bash
npm test -- --testPathPattern=books-upload.test.js
```

Note: Some tests require actual Cloudinary credentials to test the full upload functionality.