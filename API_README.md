# BookVerse API Documentation

Welcome to the BookVerse API documentation! This directory contains comprehensive documentation for the BookVerse peer-to-peer book trading platform API.

## 📚 Documentation Files

### 1. **OpenAPI Specification** (`openapi.yaml`)
The complete, machine-readable API specification following OpenAPI 3.0.3 standard.

**Use Cases:**
- Generate client SDKs automatically
- Import into API testing tools (Postman, Insomnia)
- View in Swagger UI or Redoc
- Validate API requests/responses
- Generate API documentation websites

**How to Use:**
```bash
# View in Swagger Editor (online)
# Visit: https://editor.swagger.io/
# File > Import File > Select openapi.yaml

# View in VS Code
# Install: OpenAPI (Swagger) Editor extension
# Open openapi.yaml in VS Code

# Import to Postman
# Postman > Import > Upload Files > Select openapi.yaml
```

### 2. **cURL Examples** (`API_CURL_EXAMPLES.md`)
Comprehensive collection of ready-to-use cURL commands for all API endpoints.

**Features:**
- ✅ Complete examples for every endpoint
- ✅ Organized by feature area
- ✅ Real-world workflow examples
- ✅ Error handling scenarios
- ✅ Environment setup tips
- ✅ Copy-paste ready commands

**Perfect for:**
- Quick API testing
- Shell scripting
- CI/CD integration
- Learning the API
- Debugging issues

### 3. **API Overview** (`API_DOCUMENTATION.md`)
High-level overview and quick reference guide.

**Contains:**
- Feature area summaries
- Authentication guide
- Rate limiting information
- Error response formats
- Pagination details
- Security features

## 🚀 Quick Start

### 1. Start the Server
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Test the API

**Option A: Using cURL**
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "city": "New York"
  }'

# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Option B: Using Postman**
1. Import `openapi.yaml` into Postman
2. Set up environment variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: Your JWT token from login
3. Start making requests!

**Option C: Using Swagger UI**
1. Visit [editor.swagger.io](https://editor.swagger.io/)
2. Import `openapi.yaml`
3. Try out endpoints directly in the browser

## 📋 API Feature Areas

### Authentication (`/api/auth`)
User registration, login, profile management, password operations
- Register, Login, Logout
- Profile updates with privacy settings
- Password change and reset
- Email verification
- Account deletion

### Books (`/api/books`)
Book listing CRUD operations, search, and ISBN lookup
- Create, read, update, delete book listings
- Image uploads (Cloudinary)
- Search and filter (city, genre, author, title)
- ISBN lookup (Open Library)
- External book search

### Wishlist (`/api/wishlist`)
User wishlist management with automatic matching
- Add/remove books from wishlist
- Automatic matching (ISBN, title+author, fuzzy)
- Match quality scoring (100%, 90%, 60-100%)
- Public/private wishlist items

### Trades (`/api/trades`)
Trade proposal, acceptance, decline, and completion
- Propose trades
- Accept/decline proposals
- Mark trades as complete
- Trade status tracking
- Notification integration

### Messages (`/api/messages`)
Trade-specific messaging system
- Send messages in trade chats
- Real-time message delivery
- Read receipts
- Unread message counts
- Message deletion

### Ratings (`/api/ratings`)
User rating and review system
- Submit ratings (1-5 stars)
- Required comments for low ratings
- Average rating calculation
- Rating history
- Reputation system

### Notifications (`/api/notifications`)
In-app notification management
- Trade request notifications
- Message notifications
- Wishlist match alerts
- Mark as read/unread
- Bulk operations

### Users (`/api/users`)
Public user profile access
- View user profiles
- Privacy-respecting data display
- Rating and review display

### Contact (`/api/contact`)
Contact form submission
- Support requests
- Feedback submission
- Rate-limited (3/hour per IP)

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

**Getting a Token:**
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login` - Returns JWT token
3. Use token in subsequent requests

**Token Expiration:**
- Tokens expire after 24 hours
- Logout invalidates tokens immediately
- Refresh by logging in again

## 🚦 Rate Limiting

- **Authentication endpoints**: 100 requests per minute
- **General API endpoints**: 1000 requests per 15 minutes
- **Contact form**: 3 submissions per hour per IP

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
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

## 🔍 Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_*` | Duplicate entry (e.g., `EMAIL_EXISTS`) |
| `INVALID_CREDENTIALS` | Login failed |
| `INTERNAL_ERROR` | Server error |

## 📄 Pagination

List endpoints support pagination:

**Query Parameters:**
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

## 📤 File Uploads

Book images are uploaded using `multipart/form-data`:

- **Supported formats**: JPEG, PNG
- **Max file size**: 5MB per image
- **Fields**: `frontImage`, `backImage`
- **Storage**: Cloudinary CDN
- **Alternative**: Use `googleBooksImageUrl` for external images

## 🔒 Security Features

- **Password hashing**: bcrypt with 10 salt rounds
- **JWT tokens**: 24-hour expiration
- **Token blacklisting**: Logout invalidates tokens
- **Input sanitization**: All inputs sanitized to prevent XSS
- **Rate limiting**: Prevents abuse
- **CORS**: Configured for frontend domain only
- **Helmet**: Security headers enabled
- **NoSQL injection prevention**: express-mongo-sanitize

## 🧪 Testing the API

### Using cURL
See `API_CURL_EXAMPLES.md` for comprehensive examples.

### Using Postman
1. Import `openapi.yaml`
2. Set up environment variables
3. Use collection runner for automated testing

### Using Swagger UI
1. Import `openapi.yaml` into [editor.swagger.io](https://editor.swagger.io/)
2. Try out endpoints directly in the browser

### Using HTTPie (Alternative to cURL)
```bash
# Install HTTPie
pip install httpie

# Register user
http POST localhost:5000/api/auth/register \
  name="Test User" \
  email="test@example.com" \
  password="password123" \
  city="New York"

# Login
http POST localhost:5000/api/auth/login \
  email="test@example.com" \
  password="password123"
```

## 🛠️ Development Setup

### Prerequisites
- Node.js v16+
- MongoDB
- Cloudinary account (for image uploads)

### Environment Variables
Create `.env` file in `server/` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookverse
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=24h
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

### Start Development Server
```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:5000`

## 📞 Support

For API support or questions:
- **Email**: support@bookverse.com
- **Contact Form**: `POST /api/contact`
- **GitHub Issues**: [Report bugs or request features]

## 📝 Version History

- **v1.0.0** (January 2025) - Initial release with all core features
  - User authentication and profile management
  - Book listing CRUD with image uploads
  - Wishlist system with automatic matching
  - Trade proposal and negotiation
  - Real-time messaging
  - Rating and reputation system
  - In-app notifications
  - Location-based discovery

## 🤝 Contributing

When contributing to the API:
1. Update `openapi.yaml` for any endpoint changes
2. Add cURL examples to `API_CURL_EXAMPLES.md`
3. Update `API_DOCUMENTATION.md` overview
4. Test all endpoints thoroughly
5. Update version numbers

## 📜 License

MIT License - See LICENSE file for details

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**OpenAPI Version**: 3.0.3
