# BookVerse API Documentation

## Overview

This document provides comprehensive documentation for the BookVerse API, a peer-to-peer book trading platform. The API is organized into feature areas and uses JWT authentication for protected endpoints.

## Base URLs

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.bookverse.com/api`

## API Documentation Files

This project includes comprehensive API documentation in multiple formats:

### 1. OpenAPI Specification (`openapi.yaml`)
The complete API specification is available in `openapi.yaml` in the project root. You can view it using:

- **Swagger UI**: Import the file at [editor.swagger.io](https://editor.swagger.io/)
- **Postman**: Import the OpenAPI file directly into Postman
- **VS Code**: Use the OpenAPI (Swagger) Editor extension
- **Redoc**: Use Redoc for beautiful API documentation rendering

### 2. cURL Examples (`API_CURL_EXAMPLES.md`)
Comprehensive cURL command examples for all endpoints, organized by feature area with:
- Complete workflow examples
- Error handling examples
- Environment setup tips
- Real-world usage scenarios

### 3. This Document (`API_DOCUMENTATION.md`)
High-level overview and quick reference guide

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` - Returns a JWT token

## API Feature Areas

### 1. Authentication (`/api/auth`)

User registration, login, profile management, and password operations.

**Key Endpoints:**
- `POST /auth/register` - Create new account
- `POST /auth/login` - Authenticate and get JWT token
- `GET /auth/me` - Get current user profile (protected)
- `PUT /auth/profile` - Update profile and privacy settings (protected)
- `POST /auth/logout` - Invalidate JWT token (protected)
- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `PUT /auth/change-password` - Change password (protected)
- `DELETE /auth/account` - Delete account (protected)

### 2. Books (`/api/books`)

Book listing CRUD operations, search, and ISBN lookup.

**Key Endpoints:**
- `GET /books` - Get all books with filters (city, genre, author, title)
- `POST /books` - Create book listing with images (protected)
- `GET /books/:id` - Get single book details
- `PUT /books/:id` - Update book listing (protected, owner only)
- `DELETE /books/:id` - Delete book listing (protected, owner only)
- `POST /books/isbn/:isbn` - Lookup book by ISBN (Open Library)
- `GET /books/search-external` - Search Open Library globally
- `GET /books/user/:userId` - Get books by specific user

**Example: Create Book Listing**
```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=The Great Gatsby" \
  -F "author=F. Scott Fitzgerald" \
  -F "condition=Good" \
  -F 'genres=["Classic Fiction","American Literature"]' \
  -F "isbn=9780743273565" \
  -F "frontImage=@/path/to/front.jpg"
```

### 3. Wishlist (`/api/wishlist`)

User wishlist management with automatic matching.

**Key Endpoints:**
- `GET /wishlist` - Get user's wishlist (protected)
- `POST /wishlist` - Add book to wishlist (protected)
- `DELETE /wishlist/:id` - Remove from wishlist (protected)
- `GET /wishlist/user/:userId` - Get user's public wishlist
- `GET /wishlist/matches` - Find available books matching wishlist (protected)
- `GET /wishlist/check/:bookId` - Check if book is in wishlist (protected)

**Matching Levels:**
- **Exact Match (100%)**: ISBN exact match
- **Strong Match (90%)**: Title + Author exact match
- **Fuzzy Match (60-100%)**: Similar title using Levenshtein distance

**Example: Add to Wishlist**
```bash
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "9780451524935",
    "priority": 5
  }'
```

### 4. Trades (`/api/trades`)

Trade proposal, acceptance, decline, and completion.

**Key Endpoints:**
- `GET /trades` - Get user's trades with optional status filter (protected)
- `POST /trades` - Propose new trade (protected)
- `PUT /trades/:id/accept` - Accept trade proposal (protected, receiver only)
- `PUT /trades/:id/decline` - Decline trade proposal (protected, receiver only)
- `PUT /trades/:id/complete` - Mark trade as complete (protected, both parties)

**Trade Lifecycle:**
1. **Proposed**: User A proposes trade to User B
2. **Accepted**: User B accepts → Chat enabled
3. **Completed**: Either party marks complete → Rating enabled
4. **Declined**: User B declines → Trade ends

**Example: Propose Trade**
```bash
curl -X POST http://localhost:5000/api/trades \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedBook": "507f1f77bcf86cd799439011",
    "offeredBook": "507f1f77bcf86cd799439012"
  }'
```

### 5. Messages (`/api/messages`)

Trade-specific messaging system.

**Key Endpoints:**
- `POST /messages` - Send message in trade chat (protected)
- `GET /messages/trade/:tradeId` - Get all messages for trade (protected)
- `GET /messages/trade/:tradeId/unread-count` - Get unread count (protected)
- `PATCH /messages/:id/read` - Mark message as read (protected)
- `DELETE /messages/:id` - Delete message (protected, sender only)

**Example: Send Message**
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "content": "When would you like to meet for the exchange?"
  }'
```

### 6. Ratings (`/api/ratings`)

User rating and review system.

**Key Endpoints:**
- `POST /ratings` - Submit rating for completed trade (protected)
- `GET /ratings/user/:userId` - Get all ratings for user
- `GET /ratings/trade/:tradeId` - Get rating for specific trade (protected)

**Rating Rules:**
- Only for completed trades
- 1-5 stars required
- Comment required for 3 stars or lower
- One rating per user per trade
- Updates user's average rating automatically

**Example: Submit Rating**
```bash
curl -X POST http://localhost:5000/api/ratings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 5,
    "comment": "Great trader! Book was in excellent condition."
  }'
```

### 7. Notifications (`/api/notifications`)

In-app notification management.

**Key Endpoints:**
- `GET /notifications` - Get all notifications (protected)
- `PUT /notifications/:id/read` - Mark notification as read (protected)
- `PUT /notifications/read-all` - Mark all as read (protected)
- `DELETE /notifications/clear-all` - Clear all notifications (protected)

**Notification Types:**
- `trade_request` - New trade proposal received
- `trade_accepted` - Trade proposal accepted
- `trade_declined` - Trade proposal declined
- `trade_completed` - Trade marked as complete
- `new_message` - New message in trade chat
- `wishlist_match` - Book matching wishlist is available

### 8. Users (`/api/users`)

Public user profile access.

**Key Endpoints:**
- `GET /users/:userId` - Get public user profile

**Privacy Settings:**
- Users can hide city and email via privacy settings
- Hidden fields return `null` in API responses

### 9. Cities (`/api/cities`)

City search for location-based features.

**Key Endpoints:**
- `GET /cities/search` - Search cities globally (Google Places API)
- `GET /cities/search-free` - Search cities (OpenStreetMap Nominatim)
- `GET /cities/popular` - Get popular cities by region

**Example: Search Cities**
```bash
curl -X GET "http://localhost:5000/api/cities/search?q=New%20York"
```

### 10. Recommendations (`/api/recommendations`)

Personalized book recommendations.

**Key Endpoints:**
- `GET /recommendations` - Get personalized recommendations (protected)
- `GET /recommendations/profile` - Get user preference profile (protected)

**Recommendation Algorithm:**
- Based on wishlist items, trading history, and owned books
- Considers genre and author preferences
- Excludes user's own books
- Cold start: Random popular books for new users

### 11. Nearby (`/api/nearby`)

Location-based book discovery.

**Key Endpoints:**
- `GET /nearby/same-city` - Get books from same city (protected)

**Features:**
- Shows books from users in the same city
- Respects privacy settings
- Excludes user's own books
- Supports genre, author, title filters

### 12. Contact (`/api/contact`)

Contact form submission.

**Key Endpoints:**
- `POST /contact` - Submit contact form

**Rate Limiting:** 3 submissions per hour per IP

**Example: Submit Contact Form**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "support",
    "message": "I need help with my account."
  }'
```

## Rate Limiting

- **Authentication endpoints**: 100 requests per minute
- **General API endpoints**: 1000 requests per 15 minutes
- **Contact form**: 3 submissions per hour per IP

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

### Common HTTP Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User lacks permission for this action
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Duplicate entry or resource conflict
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error occurred

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_*` - Duplicate entry (e.g., `EMAIL_EXISTS`, `DUPLICATE_WISHLIST_ITEM`)
- `INVALID_CREDENTIALS` - Login failed
- `INTERNAL_ERROR` - Server error

## Pagination

List endpoints support pagination with query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "books": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBooks": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## File Uploads

Book images are uploaded using `multipart/form-data`:

- **Supported formats**: JPEG, PNG
- **Max file size**: 5MB per image
- **Fields**: `frontImage`, `backImage`
- **Storage**: Cloudinary CDN

## Security Features

- **Password hashing**: bcrypt with 10 salt rounds
- **JWT tokens**: 24-hour expiration
- **Token blacklisting**: Logout invalidates tokens
- **Input sanitization**: All inputs sanitized to prevent XSS
- **Rate limiting**: Prevents abuse
- **CORS**: Configured for frontend domain only
- **Helmet**: Security headers enabled
- **NoSQL injection prevention**: express-mongo-sanitize

## Testing the API

### Using cURL

All endpoints include cURL examples in the OpenAPI specification.

### Using Postman

1. Import `openapi.yaml` into Postman
2. Set up environment variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: Your JWT token
3. Use `{{baseUrl}}` and `{{token}}` in requests

### Using Swagger UI

1. Visit [editor.swagger.io](https://editor.swagger.io/)
2. Import `openapi.yaml`
3. Try out endpoints directly in the browser

## Development Setup

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Server runs on**: `http://localhost:5000`

3. **API base path**: `/api`

## Support

For API support or questions:
- **Email**: support@bookverse.com
- **Contact Form**: `POST /api/contact`

## Version History

- **v1.0.0** (January 2025) - Initial release with all core features

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**OpenAPI Version**: 3.0.3
