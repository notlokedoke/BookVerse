# Books API Documentation

## 📚 Overview

The BookVerse Books API provides comprehensive book listing management functionality including CRUD operations, ISBN lookup, search and filtering, and image handling. The API supports multiple image sources (uploaded images and external API covers) and implements privacy-aware owner information display.

### Base URL

```
http://localhost:5000/api/books
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required for**: Create, Update, Delete operations
- **Public access**: Read operations (GET)

### Key Features

- ✅ **Book CRUD Operations**: Create, read, update, and delete book listings
- ✅ **ISBN Lookup**: Automatic metadata fetching from Open Library API
- ✅ **Multiple Image Sources**: Support for uploaded images and external API covers
- ✅ **Advanced Filtering**: Filter by city, genre, author, and title
- ✅ **Pagination**: Efficient pagination for large result sets
- ✅ **Privacy-Aware**: Respects user privacy settings for owner information
- ✅ **Wishlist Matching**: Automatic notifications for wishlist matches
- ✅ **Image Proxy**: CORS-free access to external book covers

---

## 📋 Table of Contents

1. [Create Book Listing](#1-create-book-listing)
2. [Get All Books](#2-get-all-books)
3. [Get Single Book](#3-get-single-book)
4. [Get User's Books](#4-get-users-books)
5. [Update Book Listing](#5-update-book-listing)
6. [Delete Book Listing](#6-delete-book-listing)
7. [ISBN Lookup](#7-isbn-lookup)
8. [External Book Search](#8-external-book-search)
9. [Image Proxy](#9-image-proxy)
10. [Error Codes](#error-codes)
11. [Data Models](#data-models)

---

## 1. Create Book Listing

Create a new book listing with images and metadata.

### Endpoint

```
POST /api/books
```

### Access

Private (requires authentication)

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Request Body (multipart/form-data)

```
title: "The Great Gatsby"
author: "F. Scott Fitzgerald"
condition: "Good"
genres: ["Classic Fiction", "American Literature"]
isbn: "9780743273565"
description: "Classic American novel in good condition"
publicationYear: 1925
publisher: "Scribner"
googleBooksImageUrl: "https://books.google.com/books/content?id=..."
frontImage: [File]
backImage: [File]
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `title` | string | Yes | Book title | 1-500 characters |
| `author` | string | Yes | Book author | 1-200 characters |
| `condition` | string | Yes | Book condition | One of: "Like New", "Good", "Fair", "Poor" |
| `genres` | array/string | Yes | Book genres (JSON array or string) | 1-5 genres, max 100 chars each |
| `isbn` | string | No | ISBN-10 or ISBN-13 | Max 20 characters |
| `description` | string | No | Book description | No limit |
| `publicationYear` | number | No | Publication year | 1000 to current year + 1 |
| `publisher` | string | No | Publisher name | Max 200 characters |
| `googleBooksImageUrl` | string | No | External cover image URL | Valid URL |
| `frontImage` | file | No | Front cover image | Image file (JPEG, PNG) |
| `backImage` | file | No | Back cover image | Image file (JPEG, PNG) |

### Image Requirements

- **At least one image source required**: Either upload front/back images OR provide googleBooksImageUrl
- **Supported formats**: JPEG, PNG
- **Max file size**: 5MB per image
- **Priority**: googleBooksImageUrl > frontImage > backImage

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Book listing created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "owner": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "condition": "Good",
    "genre": ["Classic Fiction", "American Literature"],
    "isbn": "9780743273565",
    "description": "Classic American novel in good condition",
    "publicationYear": 1925,
    "publisher": "Scribner",
    "imageUrl": "https://books.google.com/books/content?id=...",
    "googleBooksImageUrl": "https://books.google.com/books/content?id=...",
    "frontImageUrl": "https://res.cloudinary.com/.../front.jpg",
    "backImageUrl": "https://res.cloudinary.com/.../back.jpg",
    "isAvailable": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```


### Error Responses

#### Missing Required Fields

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Please provide all required fields: title, author, condition, and genres",
    "code": "MISSING_REQUIRED_FIELDS",
    "details": [
      {
        "msg": "Title is required",
        "param": "title",
        "location": "body"
      }
    ]
  }
}
```

#### No Image Provided

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "At least one image is required. Please upload front/back images or use ISBN lookup.",
    "code": "IMAGE_REQUIRED"
  }
}
```

#### Invalid Condition

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Condition must be one of: Like New, Good, Fair, Poor",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Condition must be one of: Like New, Good, Fair, Poor",
        "param": "condition",
        "location": "body"
      }
    ]
  }
}
```

#### Invalid Genre

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "At least one genre is required",
    "code": "VALIDATION_ERROR"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "title=The Great Gatsby" \
  -F "author=F. Scott Fitzgerald" \
  -F "condition=Good" \
  -F 'genres=["Classic Fiction", "American Literature"]' \
  -F "isbn=9780743273565" \
  -F "description=Classic American novel in good condition" \
  -F "publicationYear=1925" \
  -F "publisher=Scribner" \
  -F "frontImage=@/path/to/front.jpg" \
  -F "backImage=@/path/to/back.jpg"
```

### Notes

- All text inputs are automatically sanitized to prevent XSS attacks
- Genres can be provided as JSON array string or actual array
- If ISBN is provided, consider using ISBN lookup first to get metadata
- Wishlist matching is automatically triggered after book creation
- Users with matching wishlist items receive notifications
- Owner information respects privacy settings

---

## 2. Get All Books

Retrieve all available books with optional filtering and pagination.

### Endpoint

```
GET /api/books
```

### Access

Public (no authentication required)

### Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number | 1 |
| `limit` | number | No | Items per page | 20 |
| `city` | string | No | Filter by owner's city | - |
| `genre` | string | No | Filter by genre (comma-separated for multiple) | - |
| `author` | string | No | Filter by author (partial match) | - |
| `title` | string | No | Filter by title (partial match) | - |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "books": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "owner": {
          "_id": "507f191e810c19729de860ea",
          "name": "John Doe",
          "city": "New York",
          "averageRating": 4.5,
          "ratingCount": 12
        },
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "condition": "Good",
        "genre": ["Classic Fiction", "American Literature"],
        "isbn": "9780743273565",
        "description": "Classic American novel in good condition",
        "imageUrl": "https://books.google.com/books/content?id=...",
        "isAvailable": true,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBooks": 98,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Example Requests

#### Get all books (default pagination)

```bash
curl -X GET http://localhost:5000/api/books
```

#### Filter by city

```bash
curl -X GET "http://localhost:5000/api/books?city=New%20York"
```

#### Filter by genre

```bash
curl -X GET "http://localhost:5000/api/books?genre=Fiction"
```

#### Filter by multiple genres

```bash
curl -X GET "http://localhost:5000/api/books?genre=Fiction,Mystery"
```

#### Filter by author

```bash
curl -X GET "http://localhost:5000/api/books?author=Fitzgerald"
```

#### Filter by title

```bash
curl -X GET "http://localhost:5000/api/books?title=Gatsby"
```

#### Combined filters with pagination

```bash
curl -X GET "http://localhost:5000/api/books?city=New%20York&genre=Fiction&page=2&limit=10"
```

### Notes

- Only books with `isAvailable: true` are returned
- City filter only shows books from users who allow city visibility
- Genre filter supports multiple genres (comma-separated)
- Author and title filters are case-insensitive partial matches
- Results are randomly sorted to give all users fair visibility
- Maximum limit is 100 items per page
- Response includes cache headers (30 seconds)
- Owner information respects privacy settings

---

## 3. Get Single Book

Retrieve detailed information about a specific book.

### Endpoint

```
GET /api/books/:id
```

### Access

Public (no authentication required)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "owner": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "email": "john@example.com",
      "city": "New York",
      "bio": "Book enthusiast and avid reader",
      "averageRating": 4.5,
      "ratingCount": 12,
      "privacySettings": {
        "showCity": true,
        "showEmail": true
      }
    },
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "condition": "Good",
    "genre": ["Classic Fiction", "American Literature"],
    "isbn": "9780743273565",
    "description": "Classic American novel in good condition",
    "publicationYear": 1925,
    "publisher": "Scribner",
    "imageUrl": "https://books.google.com/books/content?id=...",
    "googleBooksImageUrl": "https://books.google.com/books/content?id=...",
    "frontImageUrl": "https://res.cloudinary.com/.../front.jpg",
    "backImageUrl": "https://res.cloudinary.com/.../back.jpg",
    "isAvailable": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-16T14:20:00.000Z"
  }
}
```

### Error Responses

#### Invalid Book ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid book ID format",
    "code": "INVALID_BOOK_ID"
  }
}
```

#### Book Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Book not found",
    "code": "BOOK_NOT_FOUND"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/books/507f1f77bcf86cd799439011
```

### Notes

- Returns complete book information including all image URLs
- Owner information respects privacy settings
- Email and city may be hidden based on owner's privacy preferences
- Response includes cache headers (60 seconds)
- Book ID must be a valid MongoDB ObjectId (24 hex characters)

---

## 4. Get User's Books

Retrieve all books owned by a specific user.

### Endpoint

```
GET /api/books/user/:userId
```

### Access

Public (no authentication required)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's MongoDB ObjectId |

### Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number | 1 |
| `limit` | number | No | Items per page | 20 |
| `includeUnavailable` | string | No | Include unavailable books | "false" |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "books": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "owner": {
          "_id": "507f191e810c19729de860ea",
          "name": "John Doe",
          "city": "New York",
          "averageRating": 4.5,
          "ratingCount": 12
        },
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "condition": "Good",
        "genre": ["Classic Fiction"],
        "imageUrl": "https://books.google.com/books/content?id=...",
        "isAvailable": true,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalBooks": 28,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Error Responses

#### Invalid User ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid user ID format",
    "code": "INVALID_USER_ID"
  }
}
```

### Example Requests

#### Get user's available books

```bash
curl -X GET http://localhost:5000/api/books/user/507f191e810c19729de860ea
```

#### Include unavailable books

```bash
curl -X GET "http://localhost:5000/api/books/user/507f191e810c19729de860ea?includeUnavailable=true"
```

#### With pagination

```bash
curl -X GET "http://localhost:5000/api/books/user/507f191e810c19729de860ea?page=2&limit=10"
```

### Notes

- Books are sorted by creation date (newest first)
- By default, only available books are returned
- Set `includeUnavailable=true` to see all books (useful for owner's profile)
- Maximum limit is 100 items per page
- Response includes cache headers (60 seconds, private)
- Owner information respects privacy settings

---

## 5. Update Book Listing

Update an existing book listing (owner only).

### Endpoint

```
PUT /api/books/:id
```

### Access

Private (requires authentication and ownership)

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book's MongoDB ObjectId |

### Request Body (multipart/form-data)

All fields are optional - only provide fields you want to update.

```
title: "The Great Gatsby - Updated"
author: "F. Scott Fitzgerald"
condition: "Like New"
genres: ["Classic Fiction", "American Literature", "Romance"]
isbn: "9780743273565"
description: "Updated description"
publicationYear: 1925
publisher: "Scribner"
googleBooksImageUrl: "https://books.google.com/books/content?id=..."
frontImage: [File]
backImage: [File]
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `title` | string | No | Book title | 1-500 characters |
| `author` | string | No | Book author | 1-200 characters |
| `condition` | string | No | Book condition | One of: "Like New", "Good", "Fair", "Poor" |
| `genres` | array/string | No | Book genres | 1-5 genres, max 100 chars each |
| `isbn` | string | No | ISBN (empty string to clear) | Max 20 characters |
| `description` | string | No | Description (empty string to clear) | No limit |
| `publicationYear` | number | No | Publication year | 1000 to current year + 1 |
| `publisher` | string | No | Publisher (empty string to clear) | Max 200 characters |
| `googleBooksImageUrl` | string | No | External cover URL | Valid URL |
| `frontImage` | file | No | New front cover image | Image file |
| `backImage` | file | No | New back cover image | Image file |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Book listing updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "owner": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "title": "The Great Gatsby - Updated",
    "author": "F. Scott Fitzgerald",
    "condition": "Like New",
    "genre": ["Classic Fiction", "American Literature", "Romance"],
    "imageUrl": "https://books.google.com/books/content?id=...",
    "isAvailable": true,
    "updatedAt": "2025-01-16T14:20:00.000Z"
  }
}
```

### Error Responses

#### Invalid Book ID

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid book ID format",
    "code": "INVALID_BOOK_ID"
  }
}
```

#### Book Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Book not found",
    "code": "BOOK_NOT_FOUND"
  }
}
```

#### Unauthorized Update

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only update your own book listings",
    "code": "UNAUTHORIZED_UPDATE"
  }
}
```

#### Empty Title

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Title cannot be empty",
    "code": "INVALID_TITLE"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/books/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "title=The Great Gatsby - Updated" \
  -F "condition=Like New" \
  -F 'genres=["Classic Fiction", "American Literature", "Romance"]'
```

### Notes

- Only the book owner can update the listing
- All fields are optional - only provide what you want to change
- To clear optional fields (isbn, description, publisher), send empty string
- New images replace old ones if uploaded
- Image priority: googleBooksImageUrl > frontImage > backImage
- All text inputs are sanitized to prevent XSS
- Validation runs on all provided fields

---

## 6. Delete Book Listing

Delete a book listing (owner only).

### Endpoint

```
DELETE /api/books/:id
```

### Access

Private (requires authentication and ownership)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Book listing deleted successfully"
}
```

### Error Responses

#### Invalid Book ID

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid book ID format",
    "code": "INVALID_BOOK_ID"
  }
}
```

#### Book Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Book not found",
    "code": "BOOK_NOT_FOUND"
  }
}
```

#### Unauthorized Delete

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only delete your own book listings",
    "code": "UNAUTHORIZED_DELETE"
  }
}
```

#### Active Trades Exist

**Status Code**: `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "Cannot delete book listing because it is involved in active trades. Please complete or cancel the trades first.",
    "code": "BOOK_HAS_ACTIVE_TRADES",
    "details": {
      "activeTradeCount": 1,
      "tradeIds": ["507f1f77bcf86cd799439013"]
    }
  }
}
```

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/books/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the book owner can delete the listing
- Cannot delete books involved in active trades (proposed or accepted status)
- Deletion is permanent and cannot be undone
- Associated wishlist matches and notifications are not deleted
- Uploaded images remain in Cloudinary (manual cleanup may be needed)

---

## 7. ISBN Lookup

Lookup book metadata using ISBN from Open Library API.

### Endpoint

```
POST /api/books/isbn/:isbn
```

### Access

Public (no authentication required)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isbn` | string | Yes | ISBN-10 or ISBN-13 |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Book data retrieved from Open Library",
  "data": {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "thumbnail": "https://covers.openlibrary.org/b/id/12345-L.jpg",
    "publishedDate": "1925",
    "publisher": "Scribner",
    "description": "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald..."
  }
}
```

### Error Responses

#### Missing ISBN

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "ISBN is required",
    "code": "ISBN_REQUIRED"
  }
}
```

#### Invalid ISBN Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid ISBN format. ISBN must be 10 or 13 digits.",
    "code": "INVALID_ISBN_FORMAT"
  }
}
```

#### Book Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "No book found with this ISBN",
    "code": "BOOK_NOT_FOUND"
  }
}
```

### Example Requests

#### ISBN-13

```bash
curl -X POST http://localhost:5000/api/books/isbn/9780743273565
```

#### ISBN-10

```bash
curl -X POST http://localhost:5000/api/books/isbn/0743273565
```

#### ISBN with hyphens (automatically cleaned)

```bash
curl -X POST http://localhost:5000/api/books/isbn/978-0-7432-7356-5
```

### Notes

- ISBN is automatically cleaned (hyphens and spaces removed)
- Accepts both ISBN-10 (10 digits) and ISBN-13 (13 digits)
- Uses Open Library API as the primary source
- Returns book metadata including title, author, cover image, and description
- Cover images are from Open Library's cover API
- Use this endpoint before creating a book listing to auto-fill metadata
- Response data can be directly used in book creation request

---

## 8. External Book Search

Search for books globally using Open Library API.

### Endpoint

```
GET /api/books/search-external
```

### Access

Public (no authentication required)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (title, author, or keywords) |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Books retrieved successfully from Open Library",
  "data": [
    {
      "id": "/works/OL468516W",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "thumbnail": "https://covers.openlibrary.org/b/id/12345-L.jpg",
      "publishedDate": "1925"
    },
    {
      "id": "/works/OL45804W",
      "title": "The Great Gatsby (Annotated)",
      "author": "F. Scott Fitzgerald",
      "isbn": "9781234567890",
      "thumbnail": "https://covers.openlibrary.org/b/id/67890-L.jpg",
      "publishedDate": "2020"
    }
  ]
}
```

### Error Responses

#### Missing Query

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Search query is required",
    "code": "QUERY_REQUIRED"
  }
}
```

#### Request Timeout

**Status Code**: `408 Request Timeout`

```json
{
  "success": false,
  "error": {
    "message": "Request timeout. Please try again.",
    "code": "REQUEST_TIMEOUT"
  }
}
```

#### Rate Limit Exceeded

**Status Code**: `503 Service Unavailable`

```json
{
  "success": false,
  "error": {
    "message": "Too many requests to Open Library. Please try again in a moment.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

### Example Requests

#### Search by title

```bash
curl -X GET "http://localhost:5000/api/books/search-external?q=Great%20Gatsby"
```

#### Search by author

```bash
curl -X GET "http://localhost:5000/api/books/search-external?q=F.%20Scott%20Fitzgerald"
```

#### Search by keywords

```bash
curl -X GET "http://localhost:5000/api/books/search-external?q=american%20classic%20novel"
```

### Notes

- Searches Open Library's global database
- Returns up to 10 results
- Filters for English language books only
- Results include ISBN, title, author, cover image, and publication year
- Cover images use Open Library's cover API
- Useful for helping users find books to add to their wishlist
- 10-second timeout for API requests
- Results may vary based on Open Library's database

---

## 9. Image Proxy

Proxy external book cover images to avoid CORS issues.

### Endpoint

```
GET /api/books/proxy-image
```

### Access

Public (no authentication required)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | External image URL to proxy |

### Allowed Domains

- `books.google.com`
- `books.googleusercontent.com`
- `covers.openlibrary.org`

### Success Response

**Status Code**: `200 OK`

**Content-Type**: `image/jpeg` (or appropriate image type)

Returns the raw image data with appropriate headers:
- `Content-Type`: Image MIME type
- `Cache-Control`: `public, max-age=86400` (24 hours)
- `Access-Control-Allow-Origin`: `*`

### Error Responses

#### Missing URL

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Image URL is required"
  }
}
```

#### Invalid URL Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid URL format"
  }
}
```

#### Domain Not Allowed

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "Image source not allowed"
  }
}
```

#### Failed to Fetch

**Status Code**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "message": "Failed to fetch image"
  }
}
```

### Example Request

```bash
curl -X GET "http://localhost:5000/api/books/proxy-image?url=https://books.google.com/books/content?id=..."
```

### Notes

- Solves CORS issues when displaying external book covers
- Only allows images from trusted book cover sources
- Caches images for 24 hours
- 10-second timeout for fetching external images
- Use this endpoint in `<img>` tags to display external covers
- Example: `<img src="/api/books/proxy-image?url=..." />`

---

## Error Codes

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_REQUIRED_FIELDS` | 400 | Required fields are missing |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_BOOK_ID` | 400 | Book ID format is invalid |
| `INVALID_USER_ID` | 400 | User ID format is invalid |
| `INVALID_TITLE` | 400 | Title is empty or invalid |
| `INVALID_AUTHOR` | 400 | Author is empty or invalid |
| `INVALID_CONDITION` | 400 | Condition value is invalid |
| `INVALID_GENRE` | 400 | Genre value is invalid |
| `IMAGE_REQUIRED` | 400 | At least one image is required |
| `INVALID_DATA_FORMAT` | 400 | Data format is invalid |

### ISBN Lookup Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ISBN_REQUIRED` | 400 | ISBN parameter is missing |
| `INVALID_ISBN_FORMAT` | 400 | ISBN format is invalid |
| `BOOK_NOT_FOUND` | 404 | No book found with ISBN |
| `QUERY_REQUIRED` | 400 | Search query is missing |
| `REQUEST_TIMEOUT` | 408 | External API request timeout |
| `RATE_LIMIT_EXCEEDED` | 503 | Too many requests to external API |

### Authorization Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED_UPDATE` | 403 | User cannot update this book |
| `UNAUTHORIZED_DELETE` | 403 | User cannot delete this book |
| `BOOK_HAS_ACTIVE_TRADES` | 409 | Cannot delete book with active trades |

### Not Found Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BOOK_NOT_FOUND` | 404 | Book does not exist |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### Book Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  owner: User | string;           // User object or ObjectId
  title: string;                  // Book title (1-500 chars)
  author: string;                 // Book author (1-200 chars)
  condition: string;              // "Like New" | "Good" | "Fair" | "Poor"
  genre: string[];                // Array of genres (1-5 items)
  isbn?: string;                  // ISBN-10 or ISBN-13 (optional)
  description?: string;           // Book description (optional)
  publicationYear?: number;       // Publication year (optional)
  publisher?: string;             // Publisher name (optional)
  imageUrl: string;               // Primary cover image URL
  googleBooksImageUrl?: string;   // Google Books cover URL (optional)
  frontImageUrl?: string;         // Uploaded front cover URL (optional)
  backImageUrl?: string;          // Uploaded back cover URL (optional)
  isAvailable: boolean;           // Availability status (default: true)
  createdAt: Date;                // Creation timestamp
  updatedAt?: Date;               // Last update timestamp
}
```

### Owner Object (Privacy-Aware)

```typescript
{
  _id: string;                    // User's MongoDB ObjectId
  name: string;                   // User's full name
  email?: string;                 // Email (only if showEmail: true)
  city?: string;                  // City (only if showCity: true)
  bio?: string;                   // User biography
  averageRating: number;          // Average rating (0-5)
  ratingCount: number;            // Total number of ratings
  privacySettings?: {
    showCity: boolean;            // City visibility setting
    showEmail: boolean;           // Email visibility setting
  };
}
```

### ISBN Lookup Response

```typescript
{
  title: string;                  // Book title
  author: string;                 // Book author
  isbn: string;                   // ISBN
  thumbnail?: string;             // Cover image URL
  publishedDate?: string;         // Publication year
  publisher?: string;             // Publisher name
  description?: string;           // Book description
}
```

### Pagination Object

```typescript
{
  currentPage: number;            // Current page number
  totalPages: number;             // Total number of pages
  totalBooks: number;             // Total number of books
  hasNextPage: boolean;           // Whether next page exists
  hasPrevPage: boolean;           // Whether previous page exists
}
```

---

## Filter Combinations

### Common Filter Scenarios

#### 1. Browse books in my city

```bash
curl -X GET "http://localhost:5000/api/books?city=New%20York"
```

#### 2. Find fiction books in my city

```bash
curl -X GET "http://localhost:5000/api/books?city=New%20York&genre=Fiction"
```

#### 3. Search for specific author

```bash
curl -X GET "http://localhost:5000/api/books?author=Fitzgerald"
```

#### 4. Search for specific title

```bash
curl -X GET "http://localhost:5000/api/books?title=Gatsby"
```

#### 5. Multiple genres

```bash
curl -X GET "http://localhost:5000/api/books?genre=Fiction,Mystery,Thriller"
```

#### 6. Combined search

```bash
curl -X GET "http://localhost:5000/api/books?city=New%20York&genre=Fiction&author=Fitzgerald&page=1&limit=20"
```

---

## Best Practices

### Creating Books

1. **Use ISBN lookup first**
   - Call `/api/books/isbn/:isbn` to get metadata
   - Auto-fill form fields with returned data
   - Reduces manual data entry errors

2. **Provide multiple images**
   - Upload both front and back cover images
   - Or use googleBooksImageUrl from ISBN lookup
   - Better images attract more traders

3. **Choose accurate condition**
   - Be honest about book condition
   - Builds trust in the community
   - Reduces trade disputes

4. **Add detailed description**
   - Mention any defects or highlights
   - Include edition information
   - Note if book has annotations

### Searching Books

1. **Start broad, then filter**
   - Get all books first
   - Apply city filter for local trades
   - Add genre/author filters to narrow down

2. **Use pagination**
   - Don't load all books at once
   - Use reasonable page sizes (20-50)
   - Implement infinite scroll or page navigation

3. **Cache results**
   - Respect cache headers
   - Cache for 30-60 seconds
   - Reduces server load

### Image Handling

1. **Use image proxy for external covers**
   - Avoids CORS issues
   - Provides consistent experience
   - Example: `/api/books/proxy-image?url=...`

2. **Optimize uploaded images**
   - Compress before upload
   - Use appropriate dimensions
   - Keep file size under 5MB

3. **Provide fallback images**
   - Handle missing images gracefully
   - Use placeholder images
   - Show "No image available" state

---

## Performance Considerations

### Database Optimization

- **Indexes**: Books are indexed on `owner`, `genre`, `author`, `title`, and `isAvailable`
- **Compound indexes**: `[owner, isAvailable]` for user's books queries
- **Text indexes**: `author` and `title` for search functionality
- **Lean queries**: Use `.lean()` for read-only operations

### Caching Strategy

- **Public endpoints**: 30-60 second cache
- **User-specific endpoints**: Private cache, 60 seconds
- **Image proxy**: 24-hour cache
- **Browser caching**: Leverage cache headers

### Pagination

- **Default limit**: 20 items per page
- **Maximum limit**: 100 items per page
- **Random sorting**: Gives all users fair visibility
- **Skip optimization**: Use cursor-based pagination for large datasets (future enhancement)

### Image Delivery

- **Cloudinary CDN**: Fast global delivery for uploaded images
- **Image proxy**: Caches external images for 24 hours
- **Lazy loading**: Implement on frontend for better performance
- **Responsive images**: Use appropriate sizes for different devices

---

## Security Considerations

### Input Validation

- ✅ All inputs validated with express-validator
- ✅ Text inputs sanitized to prevent XSS
- ✅ File uploads validated (type, size)
- ✅ MongoDB injection prevention

### Authorization

- ✅ JWT authentication for write operations
- ✅ Ownership verification for update/delete
- ✅ Cannot modify other users' books
- ✅ Cannot delete books with active trades

### Privacy

- ✅ Owner information respects privacy settings
- ✅ Email hidden by default
- ✅ City visibility controlled by user
- ✅ No sensitive data in public responses

### File Upload Security

- ✅ File type validation (images only)
- ✅ File size limits (5MB max)
- ✅ Secure storage in Cloudinary
- ✅ Unique filenames prevent collisions

### Image Proxy Security

- ✅ Whitelist of allowed domains
- ✅ URL validation
- ✅ Timeout protection (10 seconds)
- ✅ CORS headers properly configured

---

## Testing

### Manual Testing with cURL

#### Create a book

```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Book" \
  -F "author=Test Author" \
  -F "condition=Good" \
  -F 'genres=["Fiction"]' \
  -F "frontImage=@/path/to/image.jpg"
```

#### Get all books

```bash
curl -X GET http://localhost:5000/api/books
```

#### Get single book

```bash
curl -X GET http://localhost:5000/api/books/BOOK_ID
```

#### Update book

```bash
curl -X PUT http://localhost:5000/api/books/BOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Updated Title"
```

#### Delete book

```bash
curl -X DELETE http://localhost:5000/api/books/BOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### ISBN lookup

```bash
curl -X POST http://localhost:5000/api/books/isbn/9780743273565
```

### Automated Testing

```bash
# Run book API tests
cd server
npm test -- books.test.js
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Image required" error | Provide at least one image source (upload or URL) |
| "Invalid book ID" error | Ensure book ID is 24-character hex string |
| "Unauthorized update" error | Verify you own the book and token is valid |
| "Active trades exist" error | Complete or cancel trades before deleting |
| ISBN lookup returns no results | Try different ISBN format or check if book exists in Open Library |
| Image proxy fails | Verify URL is from allowed domain |
| Slow search results | Use pagination and filters to reduce result set |

### Debugging Checklist

- [ ] Check authentication token is valid and not expired
- [ ] Verify book ID format (24 hex characters)
- [ ] Ensure all required fields are provided
- [ ] Check file upload size and format
- [ ] Verify ownership for update/delete operations
- [ ] Check for active trades before deletion
- [ ] Validate ISBN format (10 or 13 digits)
- [ ] Ensure external API is accessible

---

## Related Documentation

- **[Authentication API](./AUTHENTICATION_API.md)** - User authentication and profile management
- **[Quick Reference](./AUTH_QUICK_REFERENCE.md)** - Quick start guide with code examples
- **[Book Cover Strategy](./BOOK_COVER_STRATEGY.md)** - Image handling and external API integration

---

## Support

For issues or questions about the Books API:

1. Check this documentation
2. Review error codes and troubleshooting section
3. Check server logs for detailed error messages
4. Verify authentication and authorization
5. Test with cURL to isolate frontend issues

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
