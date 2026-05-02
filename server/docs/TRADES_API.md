# Trades API Documentation

## 📦 Overview

The BookVerse Trades API provides comprehensive trade management functionality including trade proposals, acceptance/decline, completion, and status tracking. The API implements a complete trade lifecycle with status transitions and automatic notifications.

### Base URL

```
http://localhost:5000/api/trades
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required for**: All trade operations

### Key Features

- ✅ **Trade Proposal**: Propose book exchanges with validation
- ✅ **Trade Response**: Accept or decline trade proposals
- ✅ **Trade Completion**: Mark trades as complete
- ✅ **Status Tracking**: Complete trade lifecycle management
- ✅ **Automatic Notifications**: Notify users of trade status changes
- ✅ **Wishlist Integration**: Track wishlist fulfillment on trade acceptance
- ✅ **Book Availability**: Validate book availability before trades

### Trade Status Flow

```
proposed → accepted → completed
       ↘ declined
```

**Status Transitions:**
1. **proposed**: Initial state when trade is created
2. **accepted**: Receiver accepts the trade proposal
3. **declined**: Receiver declines the trade proposal
4. **completed**: Either party marks the trade as complete after physical exchange

---

## 📋 Table of Contents

1. [Get User's Trades](#1-get-users-trades)
2. [Propose Trade](#2-propose-trade)
3. [Accept Trade](#3-accept-trade)
4. [Decline Trade](#4-decline-trade)
5. [Complete Trade](#5-complete-trade)
6. [Error Codes](#error-codes)
7. [Data Models](#data-models)

---

## 1. Get User's Trades

Retrieve all trades where the authenticated user is either proposer or receiver.

### Endpoint

```
GET /api/trades
```

### Access

Private (requires authentication)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by trade status | - |

**Valid status values:**
- `proposed` - Pending trade proposals
- `accepted` - Accepted trades
- `declined` - Declined trades
- `completed` - Completed trades

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "proposer": {
        "_id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "city": "New York",
        "averageRating": 4.5,
        "ratingCount": 12
      },
      "receiver": {
        "_id": "507f191e810c19729de860eb",
        "name": "Jane Smith",
        "city": "Boston",
        "averageRating": 4.8,
        "ratingCount": 25
      },
      "requestedBook": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "condition": "Good",
        "genre": ["Classic Fiction"],
        "imageUrl": "https://books.google.com/books/content?id=...",
        "owner": {
          "_id": "507f191e810c19729de860eb",
          "name": "Jane Smith"
        }
      },
      "offeredBook": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "condition": "Like New",
        "genre": ["Classic Fiction"],
        "imageUrl": "https://books.google.com/books/content?id=...",
        "owner": {
          "_id": "507f191e810c19729de860ea",
          "name": "John Doe"
        }
      },
      "status": "proposed",
      "proposedAt": "2025-01-15T10:30:00.000Z",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Error Responses

#### Invalid Status Value

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Status must be one of: proposed, accepted, declined, completed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Status must be one of: proposed, accepted, declined, completed",
        "param": "status",
        "location": "query"
      }
    ]
  }
}
```

### Example Requests

#### Get all trades

```bash
curl -X GET http://localhost:5000/api/trades \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Filter by status

```bash
curl -X GET "http://localhost:5000/api/trades?status=proposed" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Returns trades where user is either proposer or receiver
- Trades are sorted by creation date (newest first)
- All book and user references are fully populated
- Password fields are excluded from user objects
- Use status filter to get specific trade types (e.g., pending proposals)

---

## 2. Propose Trade

Create a new trade proposal by offering one of your books for another user's book.

### Endpoint

```
POST /api/trades
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
  "requestedBook": "507f1f77bcf86cd799439011",
  "offeredBook": "507f1f77bcf86cd799439012"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `requestedBook` | string | Yes | Book ID you want to receive | Valid MongoDB ObjectId |
| `offeredBook` | string | Yes | Book ID you want to offer | Valid MongoDB ObjectId |

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Trade proposal created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "proposer": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "receiver": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8,
      "ratingCount": 25
    },
    "requestedBook": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "condition": "Good",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "offeredBook": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "condition": "Like New",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "status": "proposed",
    "proposedAt": "2025-01-15T10:30:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z"
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
    "message": "Invalid requested book ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid requested book ID format",
        "param": "requestedBook",
        "location": "body"
      }
    ]
  }
}
```

#### Requested Book Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Requested book not found",
    "code": "REQUESTED_BOOK_NOT_FOUND"
  }
}
```

#### Offered Book Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Offered book not found",
    "code": "OFFERED_BOOK_NOT_FOUND"
  }
}
```

#### Not Book Owner

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only offer books that you own",
    "code": "NOT_BOOK_OWNER"
  }
}
```

#### Cannot Request Own Book

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "You cannot request your own book",
    "code": "CANNOT_REQUEST_OWN_BOOK"
  }
}
```

#### Requested Book Unavailable

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Requested book is not available for trade",
    "code": "REQUESTED_BOOK_UNAVAILABLE"
  }
}
```

#### Offered Book Unavailable

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Offered book is not available for trade",
    "code": "OFFERED_BOOK_UNAVAILABLE"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/trades \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "requestedBook": "507f1f77bcf86cd799439011",
    "offeredBook": "507f1f77bcf86cd799439012"
  }'
```

### Notes

- You must own the offered book
- You cannot request your own book
- Both books must be available (isAvailable: true)
- Trade status is automatically set to "proposed"
- A notification is automatically created for the receiver
- The receiver is the owner of the requested book
- All inputs are sanitized to prevent XSS attacks
- Validation ensures both book IDs are valid MongoDB ObjectIds

---

## 3. Accept Trade

Accept a trade proposal (receiver only).

### Endpoint

```
PUT /api/trades/:id/accept
```

### Access

Private (requires authentication, receiver only)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Trade's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Trade accepted successfully. You can now communicate with the other user.",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "proposer": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "receiver": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8,
      "ratingCount": 25
    },
    "requestedBook": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "condition": "Good",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "offeredBook": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "condition": "Like New",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "status": "accepted",
    "proposedAt": "2025-01-15T10:30:00.000Z",
    "respondedAt": "2025-01-15T11:00:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid Trade ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid trade ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid trade ID format",
        "param": "id",
        "location": "params"
      }
    ]
  }
}
```

#### Trade Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Trade not found",
    "code": "TRADE_NOT_FOUND"
  }
}
```

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "Only the receiver can accept this trade",
    "code": "NOT_AUTHORIZED"
  }
}
```

#### Invalid Trade Status

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Cannot accept trade with status \"accepted\". Only proposed trades can be accepted.",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/trades/507f1f77bcf86cd799439013/accept \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the receiver (owner of requested book) can accept the trade
- Trade status must be "proposed" to be accepted
- Status transitions from "proposed" to "accepted"
- respondedAt timestamp is automatically set
- A notification is automatically created for the proposer
- Wishlist fulfillment is tracked if the requested book matches proposer's wishlist
- After acceptance, both users can communicate via trade chat
- Trade ID must be a valid MongoDB ObjectId (24 hex characters)

---

## 4. Decline Trade

Decline a trade proposal (receiver only).

### Endpoint

```
PUT /api/trades/:id/decline
```

### Access

Private (requires authentication, receiver only)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Trade's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Trade declined successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "proposer": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "receiver": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8,
      "ratingCount": 25
    },
    "requestedBook": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "condition": "Good",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "offeredBook": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "condition": "Like New",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "status": "declined",
    "proposedAt": "2025-01-15T10:30:00.000Z",
    "respondedAt": "2025-01-15T11:00:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid Trade ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid trade ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid trade ID format",
        "param": "id",
        "location": "params"
      }
    ]
  }
}
```

#### Trade Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Trade not found",
    "code": "TRADE_NOT_FOUND"
  }
}
```

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "Only the receiver can decline this trade",
    "code": "NOT_AUTHORIZED"
  }
}
```

#### Invalid Trade Status

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Cannot decline trade with status \"declined\". Only proposed trades can be declined.",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/trades/507f1f77bcf86cd799439013/decline \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the receiver (owner of requested book) can decline the trade
- Trade status must be "proposed" to be declined
- Status transitions from "proposed" to "declined"
- respondedAt timestamp is automatically set
- A notification is automatically created for the proposer
- Declined trades cannot be reopened (proposer must create a new trade)
- Trade ID must be a valid MongoDB ObjectId (24 hex characters)

---

## 5. Complete Trade

Mark a trade as complete after physical book exchange (proposer or receiver).

### Endpoint

```
PUT /api/trades/:id/complete
```

### Access

Private (requires authentication, proposer or receiver only)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Trade's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Trade marked as complete successfully. You can now rate your trading partner.",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "proposer": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "receiver": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8,
      "ratingCount": 25
    },
    "requestedBook": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "condition": "Good",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "offeredBook": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "condition": "Like New",
      "imageUrl": "https://books.google.com/books/content?id=..."
    },
    "status": "completed",
    "proposedAt": "2025-01-15T10:30:00.000Z",
    "respondedAt": "2025-01-15T11:00:00.000Z",
    "completedAt": "2025-01-16T14:00:00.000Z",
    "ratingEnabled": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid Trade ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid trade ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid trade ID format",
        "param": "id",
        "location": "params"
      }
    ]
  }
}
```

#### Trade Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Trade not found",
    "code": "TRADE_NOT_FOUND"
  }
}
```

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "Only the proposer or receiver can mark this trade as complete",
    "code": "NOT_AUTHORIZED"
  }
}
```

#### Invalid Trade Status

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Cannot complete trade with status \"proposed\". Only accepted trades can be marked as complete.",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/trades/507f1f77bcf86cd799439013/complete \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Either the proposer or receiver can mark the trade as complete
- Trade status must be "accepted" to be completed
- Status transitions from "accepted" to "completed"
- completedAt timestamp is automatically set
- ratingEnabled flag is set to true, allowing both users to rate each other
- A notification is automatically created for the other party
- After completion, both users can submit ratings for each other
- Trade ID must be a valid MongoDB ObjectId (24 hex characters)
- This endpoint should be called after the physical book exchange has occurred

---

## Error Codes

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_BOOK_ID` | 400 | Book ID format is invalid |
| `INVALID_TRADE_ID` | 400 | Trade ID format is invalid |

### Trade Proposal Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `REQUESTED_BOOK_NOT_FOUND` | 404 | Requested book does not exist |
| `OFFERED_BOOK_NOT_FOUND` | 404 | Offered book does not exist |
| `NOT_BOOK_OWNER` | 403 | User does not own the offered book |
| `CANNOT_REQUEST_OWN_BOOK` | 400 | User cannot request their own book |
| `REQUESTED_BOOK_UNAVAILABLE` | 400 | Requested book is not available |
| `OFFERED_BOOK_UNAVAILABLE` | 400 | Offered book is not available |

### Trade Response Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TRADE_NOT_FOUND` | 404 | Trade does not exist |
| `NOT_AUTHORIZED` | 403 | User not authorized for this action |
| `INVALID_TRADE_STATUS` | 400 | Trade status does not allow this action |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### Trade Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  proposer: User | string;        // User object or ObjectId (trade initiator)
  receiver: User | string;        // User object or ObjectId (trade recipient)
  requestedBook: Book | string;   // Book object or ObjectId (book being requested)
  offeredBook: Book | string;     // Book object or ObjectId (book being offered)
  status: string;                 // "proposed" | "accepted" | "declined" | "completed"
  proposedAt: Date;               // When trade was proposed
  respondedAt?: Date;             // When trade was accepted/declined (optional)
  completedAt?: Date;             // When trade was completed (optional)
  ratingEnabled?: boolean;        // Whether rating is enabled (set on completion)
  createdAt: Date;                // Creation timestamp
  updatedAt?: Date;               // Last update timestamp
}
```

### Trade Status Values

| Status | Description | Next Possible States |
|--------|-------------|---------------------|
| `proposed` | Trade has been proposed, awaiting response | `accepted`, `declined` |
| `accepted` | Trade has been accepted, users can communicate | `completed` |
| `declined` | Trade has been declined, no further action | None (terminal state) |
| `completed` | Trade has been completed, rating enabled | None (terminal state) |

### User Object (in Trade Response)

```typescript
{
  _id: string;                    // User's MongoDB ObjectId
  name: string;                   // User's full name
  city?: string;                  // City (only if showCity: true)
  averageRating: number;          // Average rating (0-5)
  ratingCount: number;            // Total number of ratings received
}
```

### Book Object (in Trade Response)

```typescript
{
  _id: string;                    // Book's MongoDB ObjectId
  title: string;                  // Book title
  author: string;                 // Book author
  condition: string;              // Book condition
  genre: string[];                // Array of genres
  imageUrl: string;               // Primary cover image URL
  owner?: User;                   // Book owner (populated in some responses)
}
```

---

## Trade Lifecycle Example

### 1. John proposes a trade

```bash
POST /api/trades
{
  "requestedBook": "jane-book-id",
  "offeredBook": "john-book-id"
}
```

**Result**: Trade created with status "proposed", Jane receives notification

### 2. Jane accepts the trade

```bash
PUT /api/trades/trade-id/accept
```

**Result**: Trade status changes to "accepted", John receives notification, chat enabled

### 3. John and Jane communicate

```bash
POST /api/messages
{
  "trade": "trade-id",
  "content": "Let's meet at the library tomorrow at 3pm"
}
```

**Result**: Messages exchanged, both users coordinate the physical exchange

### 4. After physical exchange, John marks trade complete

```bash
PUT /api/trades/trade-id/complete
```

**Result**: Trade status changes to "completed", Jane receives notification, rating enabled

### 5. Both users rate each other

```bash
POST /api/ratings
{
  "trade": "trade-id",
  "ratedUser": "jane-id",
  "stars": 5,
  "comment": "Great trading experience!"
}
```

**Result**: Ratings submitted, user reputation updated

---

## Best Practices

### For Frontend Developers

1. **Status Filtering**: Use status query parameter to show different trade views (pending, active, completed)
2. **Real-time Updates**: Poll the trades endpoint periodically to check for status changes
3. **Error Handling**: Display user-friendly error messages for validation failures
4. **Confirmation Dialogs**: Show confirmation before accepting/declining/completing trades
5. **Book Validation**: Check book availability before allowing trade proposals
6. **User Feedback**: Show loading states during API calls and success messages after actions

### For Backend Integration

1. **Authentication**: Always include JWT token in Authorization header
2. **Validation**: Validate book IDs and trade IDs before making requests
3. **Status Checks**: Verify trade status before attempting state transitions
4. **Notification Handling**: Expect automatic notifications on trade status changes
5. **Error Recovery**: Handle all error codes appropriately with user-friendly messages
6. **Wishlist Integration**: Understand that accepting trades may fulfill wishlist items

---

## Related APIs

- **Messages API**: For trade-specific communication after acceptance
- **Ratings API**: For rating trading partners after completion
- **Notifications API**: For receiving trade status updates
- **Books API**: For book availability and details
- **Wishlist API**: For wishlist fulfillment tracking

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
