# Wishlist API Documentation

## 📚 Overview

The BookVerse Wishlist API enables users to create and manage their book wishlists with automatic matching capabilities. Users can track books they're looking for, and the system automatically finds matching available books using ISBN, title/author matching, and fuzzy search algorithms.

### Base URL

```
http://localhost:5000/api/wishlist
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required for**: Create, Read (own wishlist), Delete operations
- **Public access**: Read operations for other users' public wishlists

### Key Features

- ✅ **Wishlist CRUD Operations**: Create, read, and delete wishlist items
- ✅ **Automatic Matching**: Three-level matching system (ISBN, Title+Author, Fuzzy)
- ✅ **Privacy Controls**: Public/private wishlist items
- ✅ **Priority System**: Set priority levels (1-5) for wishlist items
- ✅ **Duplicate Prevention**: Prevents duplicate entries by ISBN or title
- ✅ **Image Lookup**: Automatic cover image fetching from ISBN
- ✅ **Source Tracking**: Track if item was added from a book listing

---

## 📋 Table of Contents

1. [Add Book to Wishlist](#1-add-book-to-wishlist)
2. [Get User's Wishlist](#2-get-users-wishlist)
3. [Get Public Wishlist](#3-get-public-wishlist)
4. [Get Wishlist Matches](#4-get-wishlist-matches)
5. [Check Book in Wishlist](#5-check-book-in-wishlist)
6. [Remove Book from Wishlist](#6-remove-book-from-wishlist)
7. [Backfill Images](#7-backfill-images)
8. [Error Codes](#error-codes)
9. [Data Models](#data-models)

---

## 1. Add Book to Wishlist

Add a new book to the authenticated user's wishlist.

### Endpoint

```
POST /api/wishlist
```

### Access

Private (requires authentication)

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "notes": "Looking for a good condition copy",
  "imageUrl": "https://covers.openlibrary.org/b/id/12345-L.jpg",
  "sourceBook": "507f1f77bcf86cd799439011",
  "priority": 5,
  "isPublic": true
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `title` | string | Yes | Book title | 1-200 characters |
| `author` | string | No | Book author | Max 200 characters |
| `isbn` | string | No | ISBN-10 or ISBN-13 | Max 20 characters |
| `notes` | string | No | Personal notes about the book | Max 500 characters |
| `imageUrl` | string | No | Book cover image URL | Valid URL |
| `sourceBook` | string | No | Book listing ID if added from browse | Valid MongoDB ObjectId |
| `priority` | number | No | Priority level (1-5, where 5 is highest) | Integer 1-5, default: 3 |
| `isPublic` | boolean | No | Whether wishlist item is publicly visible | Boolean, default: false |

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Book added to wishlist successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "user": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "email": "john@example.com",
      "city": "New York"
    },
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "notes": "Looking for a good condition copy",
    "imageUrl": "https://covers.openlibrary.org/b/id/12345-L.jpg",
    "sourceBook": "507f1f77bcf86cd799439011",
    "priority": 5,
    "isPublic": true,
    "fulfilledBy": null,
    "fulfilledAt": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
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
    "message": "Title is required",
    "code": "VALIDATION_ERROR",
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

#### Duplicate Wishlist Item (ISBN)

**Status Code**: `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "This book is already in your wishlist",
    "code": "DUPLICATE_WISHLIST_ITEM"
  }
}
```

#### Duplicate Wishlist Item (Title)

**Status Code**: `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "A book with this title is already in your wishlist",
    "code": "DUPLICATE_WISHLIST_ITEM"
  }
}
```

#### Invalid Priority

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Priority must be between 1 and 5",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Priority must be between 1 and 5",
        "param": "priority",
        "location": "body"
      }
    ]
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "notes": "Looking for a good condition copy",
    "priority": 5,
    "isPublic": true
  }'
```

### Notes

- All text inputs are automatically sanitized to prevent XSS attacks
- If ISBN is provided without imageUrl, the system automatically fetches cover image from Google Books or Open Library
- Duplicate prevention checks ISBN first (if provided), then title (case-insensitive)
- Priority defaults to 3 if not specified
- isPublic defaults to false if not specified
- User information is populated in the response (excluding password)

---

## 2. Get User's Wishlist

Retrieve all wishlist items for a specific user.

### Endpoint

```
GET /api/wishlist/user/:userId
```

### Access

Public (no authentication required)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": {
        "_id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "city": "New York",
        "averageRating": 4.5,
        "ratingCount": 12,
        "privacySettings": {
          "showCity": true,
          "showEmail": false
        }
      },
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "notes": "Looking for a good condition copy",
      "imageUrl": "https://covers.openlibrary.org/b/id/12345-L.jpg",
      "priority": 5,
      "isPublic": true,
      "fulfilledBy": null,
      "fulfilledAt": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
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

### Example Request

```bash
curl -X GET http://localhost:5000/api/wishlist/user/507f191e810c19729de860ea
```

### Notes

- Returns all wishlist items for the specified user (both public and private)
- Items are sorted by creation date (newest first)
- User information respects privacy settings
- User ID must be a valid MongoDB ObjectId (24 hex characters)

---
## 3. Get Public Wishlist

Retrieve only public wishlist items for a specific user.

### Endpoint

```
GET /api/wishlist/user/:userId/public
```

### Access

Public (no authentication required)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": {
        "_id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "city": "New York",
        "averageRating": 4.5,
        "ratingCount": 12,
        "privacySettings": {
          "showCity": true,
          "showEmail": false
        }
      },
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "imageUrl": "https://covers.openlibrary.org/b/id/12345-L.jpg",
      "priority": 5,
      "isPublic": true,
      "fulfilledBy": null,
      "fulfilledAt": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
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

### Example Request

```bash
curl -X GET http://localhost:5000/api/wishlist/user/507f191e810c19729de860ea/public
```

### Notes

- Returns only public wishlist items (isPublic: true)
- Excludes fulfilled items (fulfilledBy: null)
- Items are sorted by priority (highest first), then by creation date (newest first)
- User information respects privacy settings
- Useful for displaying wishlists on public profile pages

---

## 4. Get Wishlist Matches

Find available books that match the authenticated user's wishlist items using a three-level matching algorithm.

### Endpoint

```
GET /api/wishlist/matches
```

### Access

Private (requires authentication)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### Matching Algorithm

The system uses a three-level matching algorithm with decreasing precision:

1. **Exact Match (100%)**: ISBN exact match - most reliable
2. **Strong Match (90%)**: Title + Author exact match (case-insensitive)
3. **Fuzzy Match (60-100%)**: Similar title using Levenshtein distance algorithm

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Found 2 wishlist item(s) with available matches",
  "data": [
    {
      "wishlistItem": {
        "_id": "507f1f77bcf86cd799439012",
        "user": "507f191e810c19729de860ea",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "priority": 5,
        "isPublic": true,
        "createdAt": "2025-01-15T10:30:00.000Z"
      },
      "matches": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "owner": {
            "_id": "507f191e810c19729de860eb",
            "name": "Jane Smith",
            "city": "Boston",
            "averageRating": 4.8,
            "ratingCount": 25,
            "privacySettings": {
              "showCity": true,
              "showEmail": false
            }
          },
          "title": "The Great Gatsby",
          "author": "F. Scott Fitzgerald",
          "condition": "Good",
          "genre": ["Classic Fiction"],
          "isbn": "9780743273565",
          "imageUrl": "https://covers.openlibrary.org/b/id/12345-L.jpg",
          "isAvailable": true,
          "matchType": "exact",
          "matchScore": 100,
          "createdAt": "2025-01-14T09:20:00.000Z"
        }
      ]
    }
  ],
  "count": 2
}
```

### Success Response (No Matches)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "No matches found for your wishlist items",
  "data": [],
  "count": 0
}
```

### Success Response (Empty Wishlist)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "No wishlist items to match",
  "data": [],
  "count": 0
}
```

### Match Types

| Match Type | Score | Description | Criteria |
|------------|-------|-------------|----------|
| `exact` | 100 | Perfect ISBN match | ISBN matches exactly |
| `strong` | 90 | Title + Author match | Both title and author match (case-insensitive) |
| `fuzzy` | 60-100 | Similar title | Title similarity using Levenshtein distance (≥60%) |

### Example Request

```bash
curl -X GET http://localhost:5000/api/wishlist/matches \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only returns available books (isAvailable: true)
- Excludes user's own books from matches
- Matching algorithm tries levels in order: ISBN → Title+Author → Fuzzy
- Fuzzy matches must have at least 60% similarity to be included
- Limited to 10 matches per wishlist item
- Owner information respects privacy settings
- Useful for the "Wishlist Matches" page feature

---

## 5. Check Book in Wishlist

Check if a specific book is in the authenticated user's wishlist.

### Endpoint

```
GET /api/wishlist/check/:bookId
```

### Access

Private (requires authentication)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book's MongoDB ObjectId |

### Success Response (In Wishlist)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "inWishlist": true,
    "wishlistItem": {
      "_id": "507f1f77bcf86cd799439012",
      "user": "507f191e810c19729de860ea",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "sourceBook": "507f1f77bcf86cd799439011",
      "priority": 5,
      "isPublic": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

### Success Response (Not in Wishlist)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "inWishlist": false,
    "wishlistItem": null
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

### Example Request

```bash
curl -X GET http://localhost:5000/api/wishlist/check/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Checks if the book (by sourceBook reference) is in the user's wishlist
- Returns the complete wishlist item if found
- Useful for showing "Add to Wishlist" vs "Remove from Wishlist" buttons
- Book ID must be a valid MongoDB ObjectId (24 hex characters)

---

## 6. Remove Book from Wishlist

Delete a wishlist item (owner only).

### Endpoint

```
DELETE /api/wishlist/:id
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
| `id` | string | Yes | Wishlist item's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Book removed from wishlist successfully"
}
```

### Error Responses

#### Invalid Wishlist ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid wishlist item ID format",
    "code": "INVALID_WISHLIST_ID"
  }
}
```

#### Wishlist Item Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Wishlist item not found",
    "code": "WISHLIST_ITEM_NOT_FOUND"
  }
}
```

#### Unauthorized Delete

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only remove your own wishlist items",
    "code": "UNAUTHORIZED_WISHLIST_ACCESS"
  }
}
```

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/wishlist/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the wishlist item owner can delete it
- Deletion is permanent and cannot be undone
- Wishlist item ID must be a valid MongoDB ObjectId (24 hex characters)

---

## 7. Backfill Images

Automatically fetch and add cover images for wishlist items that have ISBN but no image.

### Endpoint

```
POST /api/wishlist/backfill-images
```

### Access

Private (requires authentication)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Backfill complete: 5 images added, 2 failed",
  "data": {
    "total": 7,
    "updated": 5,
    "failed": 2
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/wishlist/backfill-images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Processes all wishlist items for the authenticated user
- Only updates items that have ISBN but no imageUrl
- Uses hybrid lookup (Google Books primary, Open Library fallback)
- Silently continues if some images fail to fetch
- Returns statistics about the backfill operation
- Useful for updating old wishlist items that were created before automatic image lookup

---

## Error Codes

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_WISHLIST_ID` | 400 | Wishlist item ID format is invalid |
| `INVALID_USER_ID` | 400 | User ID format is invalid |
| `INVALID_BOOK_ID` | 400 | Book ID format is invalid |

### Duplicate Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `DUPLICATE_WISHLIST_ITEM` | 409 | Book already exists in wishlist |

### Authorization Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED_WISHLIST_ACCESS` | 403 | User cannot access/modify this wishlist item |

### Not Found Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WISHLIST_ITEM_NOT_FOUND` | 404 | Wishlist item does not exist |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### Wishlist Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  user: User | string;            // User object or ObjectId
  title: string;                  // Book title (1-200 chars, required)
  author?: string;                // Book author (max 200 chars, optional)
  isbn?: string;                  // ISBN-10 or ISBN-13 (max 20 chars, optional)
  notes?: string;                 // Personal notes (max 500 chars, optional)
  imageUrl?: string;              // Book cover image URL (optional)
  sourceBook?: string;            // Book listing ObjectId if added from browse (optional)
  fulfilledBy?: string;           // Trade ObjectId if fulfilled (optional)
  fulfilledAt?: Date;             // Fulfillment timestamp (optional)
  priority: number;               // Priority level 1-5 (default: 3)
  isPublic: boolean;              // Public visibility (default: false)
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
}
```

### User Object (Privacy-Aware)

```typescript
{
  _id: string;                    // User's MongoDB ObjectId
  name: string;                   // User's full name
  email?: string;                 // Email (only if showEmail: true)
  city?: string;                  // City (only if showCity: true)
  averageRating: number;          // Average rating (0-5)
  ratingCount: number;            // Total number of ratings
  privacySettings: {
    showCity: boolean;            // City visibility setting
    showEmail: boolean;           // Email visibility setting
  }
}
```

### Match Object

```typescript
{
  wishlistItem: Wishlist;         // The wishlist item being matched
  matches: MatchedBook[];         // Array of matching books
}
```

### Matched Book Object

```typescript
{
  _id: string;                    // Book's MongoDB ObjectId
  owner: User;                    // Book owner (privacy-aware)
  title: string;                  // Book title
  author: string;                 // Book author
  condition: string;              // Book condition
  genre: string[];                // Book genres
  isbn?: string;                  // ISBN (optional)
  imageUrl: string;               // Book cover image URL
  isAvailable: boolean;           // Availability status
  matchType: string;              // "exact" | "strong" | "fuzzy"
  matchScore: number;             // Match quality score (60-100)
  createdAt: Date;                // Creation timestamp
}
```

---

## Usage Examples

### Complete Workflow: Add to Wishlist and Find Matches

```bash
# 1. Add a book to wishlist
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "9780451524935",
    "priority": 5,
    "isPublic": true
  }'

# 2. Find matches for your wishlist
curl -X GET http://localhost:5000/api/wishlist/matches \
  -H "Authorization: Bearer <token>"

# 3. View another user's public wishlist
curl -X GET http://localhost:5000/api/wishlist/user/507f191e810c19729de860ea/public

# 4. Remove a book from wishlist
curl -X DELETE http://localhost:5000/api/wishlist/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>"
```

### Get Authenticated User's Own Wishlist

```bash
# Note: Use the dedicated endpoint for authenticated user
curl -X GET http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": "507f191e810c19729de860ea",
      "title": "1984",
      "author": "George Orwell",
      "isbn": "9780451524935",
      "priority": 5,
      "isPublic": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Best Practices

### Adding Books to Wishlist

1. **Always provide ISBN when available** - enables exact matching and automatic image lookup
2. **Set appropriate priority** - helps organize your wishlist (5 = highest priority)
3. **Use isPublic wisely** - public items help other users find potential trade matches
4. **Add notes** - helps remember specific edition or condition preferences

### Finding Matches

1. **Check matches regularly** - new books are added to the platform daily
2. **Understand match types** - exact matches are most reliable, fuzzy matches may need verification
3. **Review match scores** - higher scores indicate better matches

### Privacy Considerations

1. **Public wishlists** - visible to all users, helps facilitate trades
2. **Private wishlists** - only visible to you, useful for personal tracking
3. **User privacy settings** - respected in all responses (city, email visibility)

---

## Related Endpoints

- **Books API**: `/api/books` - Browse available books that match your wishlist
- **Trades API**: `/api/trades` - Propose trades for matched books
- **User API**: `/api/users` - View user profiles with their wishlists

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production-Ready
