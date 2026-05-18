# BookVerse API - cURL Examples

This document provides comprehensive cURL command examples for all BookVerse API endpoints, organized by feature area.

## Table of Contents
- [Authentication](#authentication)
- [Books](#books)
- [Wishlist](#wishlist)
- [Trades](#trades)
- [Messages](#messages)
- [Ratings](#ratings)
- [Notifications](#notifications)
- [Users](#users)
- [Contact](#contact)

## Base URL
```bash
BASE_URL="http://localhost:5000/api"
# or for production:
# BASE_URL="https://api.bookverse.com/api"
```

## Authentication

### Register New User
```bash
curl -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "city": "New York"
  }'
```

### Login
```bash
curl -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Save the token from response:
# TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Current User Profile
```bash
curl -X GET ${BASE_URL}/auth/me \
  -H "Authorization: Bearer ${TOKEN}"
```

### Update Profile
```bash
curl -X PUT ${BASE_URL}/auth/profile \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "city": "Los Angeles",
    "bio": "Book enthusiast and avid reader",
    "privacySettings": {
      "showCity": true,
      "showEmail": false
    }
  }'
```

### Change Password
```bash
curl -X PUT ${BASE_URL}/auth/change-password \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

### Forgot Password
```bash
curl -X POST ${BASE_URL}/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Reset Password
```bash
curl -X POST ${BASE_URL}/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "newpassword456"
  }'
```

### Logout
```bash
curl -X POST ${BASE_URL}/auth/logout \
  -H "Authorization: Bearer ${TOKEN}"
```

### Delete Account
```bash
curl -X DELETE ${BASE_URL}/auth/account \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "password123",
    "confirmText": "DELETE"
  }'
```

---

## Books

### Get All Books (with filters)
```bash
# Basic - get all books
curl -X GET "${BASE_URL}/books"

# With pagination
curl -X GET "${BASE_URL}/books?page=1&limit=20"

# Filter by city
curl -X GET "${BASE_URL}/books?city=New%20York"

# Filter by genre
curl -X GET "${BASE_URL}/books?genre=Fiction"

# Filter by multiple genres
curl -X GET "${BASE_URL}/books?genre=Fiction,Mystery"

# Filter by author
curl -X GET "${BASE_URL}/books?author=Fitzgerald"

# Filter by title
curl -X GET "${BASE_URL}/books?title=Gatsby"

# Combined filters
curl -X GET "${BASE_URL}/books?city=New%20York&genre=Fiction&page=1&limit=20"
```

### Get Book by ID
```bash
curl -X GET ${BASE_URL}/books/507f1f77bcf86cd799439011
```

### Get Books by User
```bash
# Get all available books by user
curl -X GET ${BASE_URL}/books/user/507f191e810c19729de860ea

# Include unavailable books
curl -X GET "${BASE_URL}/books/user/507f191e810c19729de860ea?includeUnavailable=true"

# With pagination
curl -X GET "${BASE_URL}/books/user/507f191e810c19729de860ea?page=1&limit=20"
```

### Create Book Listing (with images)
```bash
# With uploaded images
curl -X POST ${BASE_URL}/books \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "title=The Great Gatsby" \
  -F "author=F. Scott Fitzgerald" \
  -F "condition=Good" \
  -F 'genres=["Classic Fiction","American Literature"]' \
  -F "isbn=9780743273565" \
  -F "description=Classic American novel in good condition" \
  -F "publicationYear=1925" \
  -F "publisher=Scribner" \
  -F "frontImage=@/path/to/front-cover.jpg" \
  -F "backImage=@/path/to/back-cover.jpg"

# With Google Books image URL (no file upload)
curl -X POST ${BASE_URL}/books \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "title=1984" \
  -F "author=George Orwell" \
  -F "condition=Like New" \
  -F 'genres=["Dystopian","Science Fiction"]' \
  -F "isbn=9780451524935" \
  -F "googleBooksImageUrl=https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
```

### Update Book Listing
```bash
curl -X PUT ${BASE_URL}/books/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "title=The Great Gatsby (Updated)" \
  -F "condition=Like New" \
  -F 'genres=["Classic Fiction"]'
```

### Delete Book Listing
```bash
curl -X DELETE ${BASE_URL}/books/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer ${TOKEN}"
```

### Lookup Book by ISBN
```bash
# ISBN-13
curl -X POST ${BASE_URL}/books/isbn/9780743273565

# ISBN-10
curl -X POST ${BASE_URL}/books/isbn/0743273567
```

### Search Books Externally (Open Library)
```bash
curl -X GET "${BASE_URL}/books/search-external?q=The%20Great%20Gatsby"
```

---

## Wishlist

### Get User's Wishlist
```bash
curl -X GET ${BASE_URL}/wishlist \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get Public Wishlist for User
```bash
curl -X GET ${BASE_URL}/wishlist/user/507f191e810c19729de860ea
```

### Add Book to Wishlist
```bash
# With ISBN
curl -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "9780451524935",
    "priority": 5,
    "notes": "Looking for hardcover edition",
    "isPublic": true
  }'

# Without ISBN
curl -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "priority": 4
  }'
```

### Remove from Wishlist
```bash
curl -X DELETE ${BASE_URL}/wishlist/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer ${TOKEN}"
```

### Find Wishlist Matches
```bash
curl -X GET ${BASE_URL}/wishlist/matches \
  -H "Authorization: Bearer ${TOKEN}"
```

### Check if Book is in Wishlist
```bash
curl -X GET ${BASE_URL}/wishlist/check/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Trades

### Get User's Trades
```bash
# Get all trades
curl -X GET ${BASE_URL}/trades \
  -H "Authorization: Bearer ${TOKEN}"

# Filter by status
curl -X GET "${BASE_URL}/trades?status=proposed" \
  -H "Authorization: Bearer ${TOKEN}"

curl -X GET "${BASE_URL}/trades?status=accepted" \
  -H "Authorization: Bearer ${TOKEN}"

curl -X GET "${BASE_URL}/trades?status=completed" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Propose a Trade
```bash
curl -X POST ${BASE_URL}/trades \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedBook": "507f1f77bcf86cd799439011",
    "offeredBook": "507f1f77bcf86cd799439012"
  }'
```

### Accept Trade Proposal
```bash
curl -X PUT ${BASE_URL}/trades/507f1f77bcf86cd799439013/accept \
  -H "Authorization: Bearer ${TOKEN}"
```

### Decline Trade Proposal
```bash
curl -X PUT ${BASE_URL}/trades/507f1f77bcf86cd799439013/decline \
  -H "Authorization: Bearer ${TOKEN}"
```

### Mark Trade as Complete
```bash
curl -X PUT ${BASE_URL}/trades/507f1f77bcf86cd799439013/complete \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Messages

### Send Message in Trade Chat
```bash
curl -X POST ${BASE_URL}/messages \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "content": "When would you like to meet for the exchange?"
  }'
```

### Get All Messages for Trade
```bash
curl -X GET ${BASE_URL}/messages/trade/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get Unread Message Count for Trade
```bash
curl -X GET ${BASE_URL}/messages/trade/507f1f77bcf86cd799439013/unread-count \
  -H "Authorization: Bearer ${TOKEN}"
```

### Mark Message as Read
```bash
curl -X PATCH ${BASE_URL}/messages/507f1f77bcf86cd799439015/read \
  -H "Authorization: Bearer ${TOKEN}"
```

### Delete Message
```bash
curl -X DELETE ${BASE_URL}/messages/507f1f77bcf86cd799439015 \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Ratings

### Submit Rating for Completed Trade
```bash
# 5-star rating (comment optional)
curl -X POST ${BASE_URL}/ratings \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 5,
    "comment": "Great trader! Book was in excellent condition."
  }'

# 3-star or lower rating (comment required)
curl -X POST ${BASE_URL}/ratings \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 3,
    "comment": "Book condition was not as described."
  }'
```

### Get All Ratings for User
```bash
curl -X GET ${BASE_URL}/ratings/user/507f191e810c19729de860ea
```

### Get Rating for Specific Trade
```bash
curl -X GET ${BASE_URL}/ratings/trade/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Notifications

### Get All Notifications
```bash
curl -X GET ${BASE_URL}/notifications \
  -H "Authorization: Bearer ${TOKEN}"
```

### Mark Notification as Read
```bash
curl -X PUT ${BASE_URL}/notifications/507f1f77bcf86cd799439016/read \
  -H "Authorization: Bearer ${TOKEN}"
```

### Mark All Notifications as Read
```bash
curl -X PUT ${BASE_URL}/notifications/read-all \
  -H "Authorization: Bearer ${TOKEN}"
```

### Clear All Notifications
```bash
curl -X DELETE ${BASE_URL}/notifications/clear-all \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Users

### Get Public User Profile
```bash
curl -X GET ${BASE_URL}/users/507f191e810c19729de860ea
```

---

## Contact

### Submit Contact Form
```bash
curl -X POST ${BASE_URL}/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "support",
    "message": "I need help with my account."
  }'
```

---

## Complete Workflow Examples

### Example 1: Register, Login, and Create Book Listing
```bash
# 1. Register
curl -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "password123",
    "city": "San Francisco"
  }'

# 2. Login and save token
TOKEN=$(curl -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

# 3. Create book listing
curl -X POST ${BASE_URL}/books \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "title=The Catcher in the Rye" \
  -F "author=J.D. Salinger" \
  -F "condition=Good" \
  -F 'genres=["Classic Fiction"]' \
  -F "isbn=9780316769174" \
  -F "googleBooksImageUrl=https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg"
```

### Example 2: Complete Trade Flow
```bash
# Assume TOKEN1 for User A, TOKEN2 for User B

# 1. User A proposes trade
TRADE_ID=$(curl -X POST ${BASE_URL}/trades \
  -H "Authorization: Bearer ${TOKEN1}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedBook": "BOOK_ID_FROM_USER_B",
    "offeredBook": "BOOK_ID_FROM_USER_A"
  }' | jq -r '.data._id')

# 2. User B accepts trade
curl -X PUT ${BASE_URL}/trades/${TRADE_ID}/accept \
  -H "Authorization: Bearer ${TOKEN2}"

# 3. User A sends message
curl -X POST ${BASE_URL}/messages \
  -H "Authorization: Bearer ${TOKEN1}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "'${TRADE_ID}'",
    "content": "Hi! When would you like to meet?"
  }'

# 4. User B responds
curl -X POST ${BASE_URL}/messages \
  -H "Authorization: Bearer ${TOKEN2}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "'${TRADE_ID}'",
    "content": "How about Saturday at 2pm at Central Park?"
  }'

# 5. After physical exchange, User A marks complete
curl -X PUT ${BASE_URL}/trades/${TRADE_ID}/complete \
  -H "Authorization: Bearer ${TOKEN1}"

# 6. User A rates User B
curl -X POST ${BASE_URL}/ratings \
  -H "Authorization: Bearer ${TOKEN1}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "'${TRADE_ID}'",
    "stars": 5,
    "comment": "Excellent trader! Very friendly and punctual."
  }'

# 7. User B rates User A
curl -X POST ${BASE_URL}/ratings \
  -H "Authorization: Bearer ${TOKEN2}" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "'${TRADE_ID}'",
    "stars": 5,
    "comment": "Great experience! Book was exactly as described."
  }'
```

### Example 3: Wishlist and Matching
```bash
# 1. Add books to wishlist
curl -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Harry Potter and the Philosopher'\''s Stone",
    "author": "J.K. Rowling",
    "isbn": "9780747532699",
    "priority": 5
  }'

curl -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "isbn": "9780547928227",
    "priority": 4
  }'

# 2. Find matches
curl -X GET ${BASE_URL}/wishlist/matches \
  -H "Authorization: Bearer ${TOKEN}"

# 3. View matched book details
curl -X GET ${BASE_URL}/books/MATCHED_BOOK_ID

# 4. Propose trade for matched book
curl -X POST ${BASE_URL}/trades \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedBook": "MATCHED_BOOK_ID",
    "offeredBook": "YOUR_BOOK_ID"
  }'
```

---

## Error Handling Examples

### Handle 401 Unauthorized
```bash
# If token is expired or invalid, you'll get:
# {"success":false,"error":{"message":"Invalid or expired token","code":"UNAUTHORIZED"}}

# Solution: Login again to get new token
TOKEN=$(curl -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.data.token')
```

### Handle 409 Conflict (Duplicate)
```bash
# If trying to add duplicate wishlist item:
# {"success":false,"error":{"message":"This book is already in your wishlist","code":"DUPLICATE_WISHLIST_ITEM"}}

# Solution: Check existing wishlist first
curl -X GET ${BASE_URL}/wishlist \
  -H "Authorization: Bearer ${TOKEN}"
```

### Handle 429 Rate Limit
```bash
# If rate limit exceeded:
# {"success":false,"error":{"message":"Too many requests","code":"RATE_LIMIT_EXCEEDED"}}

# Solution: Wait before retrying
sleep 60
curl -X POST ${BASE_URL}/auth/login ...
```

---

## Tips for Using cURL

### Save Response to File
```bash
curl -X GET ${BASE_URL}/books > books.json
```

### Pretty Print JSON Response (with jq)
```bash
curl -X GET ${BASE_URL}/books | jq '.'
```

### Extract Specific Field from Response
```bash
# Get just the token
TOKEN=$(curl -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' \
  | jq -r '.data.token')

# Get book count
curl -X GET ${BASE_URL}/books | jq '.data.pagination.totalBooks'
```

### Include Response Headers
```bash
curl -i -X GET ${BASE_URL}/books
```

### Verbose Output (for debugging)
```bash
curl -v -X GET ${BASE_URL}/books
```

### Set Timeout
```bash
curl --max-time 10 -X GET ${BASE_URL}/books
```

---

## Environment Variables Setup

Create a `.env` file for easier testing:

```bash
# .env
export BASE_URL="http://localhost:5000/api"
export TOKEN="your_jwt_token_here"
export USER_ID="your_user_id_here"
```

Load it:
```bash
source .env
```

Then use in commands:
```bash
curl -X GET ${BASE_URL}/auth/me \
  -H "Authorization: Bearer ${TOKEN}"
```

---

**Last Updated:** January 2025  
**API Version:** 1.0.0
