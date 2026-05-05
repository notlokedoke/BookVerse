# Ratings API Documentation

## ⭐ Overview

The BookVerse Ratings API provides a comprehensive rating system for users to evaluate their trading partners after completing book exchanges. The API implements a 1-5 star rating system with mandatory comments for low ratings, ensuring accountability and building trust within the community.

### Base URL

```
http://localhost:5000/api/ratings
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required for**: Rating submission and viewing own ratings

### Key Features

- ✅ **Star Ratings**: 1-5 star rating system for trade partners
- ✅ **Mandatory Comments**: Required comments for ratings ≤ 3 stars
- ✅ **Duplicate Prevention**: One rating per user per trade
- ✅ **Trade Validation**: Only completed trades can be rated
- ✅ **Participant Verification**: Only trade participants can submit ratings
- ✅ **Automatic Calculation**: Real-time average rating updates
- ✅ **Public Visibility**: User ratings are publicly viewable
- ✅ **Input Sanitization**: XSS prevention on all comment content

### Rating Requirements

```
Stars: 1-5 (integer)
Comment: Required if stars ≤ 3, optional if stars > 3
Max Comment Length: 1000 characters
Trade Status: Must be "completed"
Authorization: Must be trade participant (proposer or receiver)
Uniqueness: One rating per user per trade
```

---

## 📋 Table of Contents

1. [Submit Rating](#1-submit-rating)
2. [Get User's Ratings](#2-get-users-ratings)
3. [Get Rating for Trade](#3-get-rating-for-trade)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)

---

## 1. Submit Rating

Submit a rating for a completed trade to evaluate your trading partner.

### Endpoint

```
POST /api/ratings
```

### Access

Private (requires authentication, trade participants only)

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```json
{
  "trade": "507f1f77bcf86cd799439013",
  "stars": 5,
  "comment": "Great trading experience! Book was in excellent condition."
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `trade` | string | Yes | Trade's MongoDB ObjectId | Valid 24-character hex string |
| `stars` | number | Yes | Star rating | Integer between 1-5 |
| `comment` | string | Conditional | Rating comment | Required if stars ≤ 3, max 1000 characters |

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "trade": {
      "_id": "507f1f77bcf86cd799439013",
      "proposer": "507f191e810c19729de860ea",
      "receiver": "507f191e810c19729de860eb",
      "status": "completed"
    },
    "rater": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "ratedUser": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8,
      "ratingCount": 26
    },
    "stars": 5,
    "comment": "Great trading experience! Book was in excellent condition.",
    "createdAt": "2025-01-17T10:30:00.000Z"
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
    "message": "Trade ID is required",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Trade ID is required",
        "param": "trade",
        "location": "body"
      }
    ]
  }
}
```

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
        "param": "trade",
        "location": "body"
      }
    ]
  }
}
```

#### Invalid Stars Value

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Stars must be an integer between 1 and 5",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Stars must be an integer between 1 and 5",
        "param": "stars",
        "location": "body"
      }
    ]
  }
}
```

#### Missing Comment for Low Rating

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Comment is required for ratings of 3 stars or lower",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Comment is required for ratings of 3 stars or lower",
        "param": "comment",
        "location": "body"
      }
    ]
  }
}
```

#### Comment Too Long

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Comment must not exceed 1000 characters",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Comment must not exceed 1000 characters",
        "param": "comment",
        "location": "body"
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

#### Trade Not Completed

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Cannot rate trade with status \"accepted\". Only completed trades can be rated.",
    "code": "TRADE_NOT_COMPLETED"
  }
}
```

#### Not Trade Participant

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only rate trades you are part of",
    "code": "NOT_AUTHORIZED"
  }
}
```

#### Duplicate Rating

**Status Code**: `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "You have already rated this trade",
    "code": "DUPLICATE_RATING"
  }
}
```

### Example Requests

#### Submit 5-star rating (comment optional)

```bash
curl -X POST http://localhost:5000/api/ratings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 5,
    "comment": "Excellent trader! Book was exactly as described."
  }'
```

#### Submit 3-star rating (comment required)

```bash
curl -X POST http://localhost:5000/api/ratings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 3,
    "comment": "Book condition was acceptable but not as described. Communication was good."
  }'
```

### Notes

- **Trade Status**: Trade must have status "completed" to be rated
- **Participant Verification**: Only the proposer or receiver can rate the trade
- **Rated User**: The system automatically determines who is being rated (the other party in the trade)
- **Comment Requirement**: Comments are mandatory for ratings of 3 stars or lower to provide context
- **Duplicate Prevention**: Each user can only rate a specific trade once (enforced by compound unique index)
- **Average Rating Update**: The rated user's average rating and rating count are automatically recalculated
- **Input Sanitization**: All comment content is sanitized to prevent XSS attacks
- **Character Limit**: Comments are limited to 1000 characters
- **Whitespace Handling**: Comments are automatically trimmed of leading/trailing whitespace

---

## 2. Get User's Ratings

Retrieve all ratings received by a specific user, sorted by most recent first.

### Endpoint

```
GET /api/ratings/user/:userId
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
      "_id": "507f1f77bcf86cd799439030",
      "trade": {
        "_id": "507f1f77bcf86cd799439013",
        "proposer": "507f191e810c19729de860ea",
        "receiver": "507f191e810c19729de860eb",
        "requestedBook": "507f1f77bcf86cd799439011",
        "offeredBook": "507f1f77bcf86cd799439012",
        "status": "completed"
      },
      "rater": {
        "_id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "city": "New York",
        "averageRating": 4.5,
        "ratingCount": 12
      },
      "ratedUser": "507f191e810c19729de860eb",
      "stars": 5,
      "comment": "Great trading experience! Book was in excellent condition.",
      "createdAt": "2025-01-17T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "trade": {
        "_id": "507f1f77bcf86cd799439014",
        "proposer": "507f191e810c19729de860ec",
        "receiver": "507f191e810c19729de860eb",
        "requestedBook": "507f1f77bcf86cd799439015",
        "offeredBook": "507f1f77bcf86cd799439016",
        "status": "completed"
      },
      "rater": {
        "_id": "507f191e810c19729de860ec",
        "name": "Alice Johnson",
        "city": "Chicago",
        "averageRating": 4.7,
        "ratingCount": 18
      },
      "ratedUser": "507f191e810c19729de860eb",
      "stars": 4,
      "comment": "Good experience overall. Would trade again.",
      "createdAt": "2025-01-16T14:20:00.000Z"
    }
  ]
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
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid user ID format",
        "param": "userId",
        "location": "params"
      }
    ]
  }
}
```

#### User Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/ratings/user/507f191e810c19729de860eb
```

### Notes

- **Public Access**: No authentication required - ratings are publicly viewable
- **Sorting**: Ratings are sorted by creation date (newest first)
- **Population**: Rater information is fully populated (excluding password)
- **Trade Context**: Trade information is included for context
- **Empty Array**: Returns empty array if user has no ratings
- **Privacy**: Rater's city is only shown if their privacy settings allow it
- **Use Case**: Display on user profile pages to show reputation and trading history

---

## 3. Get Rating for Trade

Retrieve the rating submitted by the authenticated user for a specific trade.

### Endpoint

```
GET /api/ratings/trade/:tradeId
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
| `tradeId` | string | Yes | Trade's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "trade": {
      "_id": "507f1f77bcf86cd799439013",
      "proposer": "507f191e810c19729de860ea",
      "receiver": "507f191e810c19729de860eb",
      "requestedBook": "507f1f77bcf86cd799439011",
      "offeredBook": "507f1f77bcf86cd799439012",
      "status": "completed"
    },
    "rater": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5,
      "ratingCount": 12
    },
    "ratedUser": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8,
      "ratingCount": 26
    },
    "stars": 5,
    "comment": "Great trading experience! Book was in excellent condition.",
    "createdAt": "2025-01-17T10:30:00.000Z"
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
        "param": "tradeId",
        "location": "params"
      }
    ]
  }
}
```

#### Rating Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Rating not found",
    "code": "RATING_NOT_FOUND"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/ratings/trade/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- **Authentication Required**: Must be logged in to check your own rating
- **User-Specific**: Returns only the rating submitted by the authenticated user
- **Full Population**: All references (rater, ratedUser, trade) are fully populated
- **Use Case**: Check if you've already rated a trade before showing rating form
- **Not Found**: Returns 404 if the authenticated user hasn't rated this trade yet
- **Privacy**: User information respects privacy settings

---

## Error Codes

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_TRADE_ID` | 400 | Trade ID format is invalid |
| `INVALID_USER_ID` | 400 | User ID format is invalid |

### Resource Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TRADE_NOT_FOUND` | 404 | Trade does not exist |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `RATING_NOT_FOUND` | 404 | Rating does not exist |

### Authorization Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_AUTHORIZED` | 403 | User not authorized to rate this trade |

### Business Logic Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TRADE_NOT_COMPLETED` | 400 | Trade must be completed before rating |
| `DUPLICATE_RATING` | 409 | User has already rated this trade |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### Rating Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  trade: Trade | string;          // Trade object or ObjectId
  rater: User | string;           // User object or ObjectId (person giving rating)
  ratedUser: User | string;       // User object or ObjectId (person being rated)
  stars: number;                  // Star rating (1-5, integer)
  comment?: string;               // Optional comment (required if stars ≤ 3)
  createdAt: Date;                // Rating creation timestamp
}
```

### Rating Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `trade` | ObjectId | Yes | Valid MongoDB ObjectId, trade must exist |
| `rater` | ObjectId | Yes | Valid MongoDB ObjectId, must be authenticated user |
| `ratedUser` | ObjectId | Yes | Valid MongoDB ObjectId, automatically determined |
| `stars` | Number | Yes | Integer between 1-5 (inclusive) |
| `comment` | String | Conditional | Required if stars ≤ 3, max 1000 characters, trimmed |
| `createdAt` | Date | Auto | Automatically set on creation |

### User Object (in Rating Response)

```typescript
{
  _id: string;                    // User's MongoDB ObjectId
  name: string;                   // User's full name
  city?: string;                  // City (only if showCity: true)
  averageRating: number;          // Average rating (0-5, calculated)
  ratingCount: number;            // Total number of ratings received
}
```

### Trade Object (in Rating Response)

```typescript
{
  _id: string;                    // Trade's MongoDB ObjectId
  proposer: string;               // Proposer's user ID
  receiver: string;               // Receiver's user ID
  requestedBook: string;          // Requested book ID
  offeredBook: string;            // Offered book ID
  status: string;                 // Trade status (should be "completed")
}
```

---

## Rating Lifecycle Example

### 1. Trade is completed

```bash
PUT /api/trades/507f1f77bcf86cd799439013/complete
```

**Result**: Trade status changes to "completed", rating enabled for both users

### 2. John checks if he's already rated

```bash
GET /api/ratings/trade/507f1f77bcf86cd799439013
```

**Result**: Returns 404 (not rated yet), UI shows rating form

### 3. John submits a 5-star rating

```bash
POST /api/ratings
{
  "trade": "507f1f77bcf86cd799439013",
  "stars": 5,
  "comment": "Excellent trader! Book was exactly as described."
}
```

**Result**: Rating created, Jane's average rating updated from 4.75 to 4.8

### 4. Jane submits a 3-star rating with comment

```bash
POST /api/ratings
{
  "trade": "507f1f77bcf86cd799439013",
  "stars": 3,
  "comment": "Book condition was acceptable but not as described."
}
```

**Result**: Rating created (comment required for ≤3 stars), John's average rating updated

### 5. View Jane's ratings on her profile

```bash
GET /api/ratings/user/507f191e810c19729de860eb
```

**Result**: Returns all ratings Jane has received, sorted by most recent

---

## Best Practices

### For Frontend Developers

1. **Rating Form Validation**: 
   - Show comment field as required when stars ≤ 3
   - Display character counter for comments (1000 max)
   - Disable submit button until validation passes

2. **User Experience**:
   - Show star rating as interactive stars (not just numbers)
   - Display average rating with star visualization
   - Show rating count alongside average (e.g., "4.8 (26 ratings)")
   - Use relative timestamps for rating dates

3. **Error Handling**:
   - Check if user has already rated before showing form
   - Display user-friendly error messages for validation failures
   - Show confirmation dialog before submitting rating

4. **Profile Display**:
   - Show recent ratings on user profile
   - Display rating distribution (5-star breakdown)
   - Include trade context with each rating
   - Respect privacy settings when showing rater information

5. **Trade Completion Flow**:
   - After marking trade complete, prompt user to rate
   - Show "Rate your trading partner" call-to-action
   - Allow rating later from trade history

### For Backend Integration

1. **Authentication**: Always include JWT token for rating submission
2. **Validation**: Validate trade ID format before making requests
3. **Comment Requirement**: Enforce comment requirement client-side for better UX
4. **Error Recovery**: Handle all error codes with appropriate user feedback
5. **Duplicate Prevention**: Check if rating exists before showing form
6. **Trade Status**: Verify trade is completed before allowing rating

### Security Considerations

1. **Access Control**: Only trade participants can submit ratings
2. **Trade Status**: Ratings only allowed for completed trades
3. **XSS Prevention**: All comment content is sanitized with DOMPurify
4. **Input Validation**: Stars limited to 1-5 integer range
5. **Duplicate Prevention**: Compound unique index prevents duplicate ratings
6. **Privacy**: User information respects privacy settings in responses

---

## Integration with Other APIs

### Trades API

- Ratings are only available for trades with status "completed"
- Trade ID is required for rating submission
- Trade participants are validated before allowing ratings
- See [Trades API](./TRADES_API.md) for trade completion workflow

### Users API

- Average rating and rating count are automatically updated on User model
- User ratings are displayed on profile pages
- Privacy settings affect visibility of rater information

### Notifications API (Future Enhancement)

- Consider notifying users when they receive a new rating
- Notification type: `new_rating`
- Include rating stars and rater information

---

## Average Rating Calculation

### How It Works

1. When a rating is submitted, the system:
   - Fetches all ratings for the rated user
   - Calculates total stars: `sum of all stars`
   - Calculates rating count: `number of ratings`
   - Calculates average: `total stars / rating count`
   - Updates User model with new `averageRating` and `ratingCount`

2. The calculation is performed in real-time on each rating submission

3. Average rating is displayed with 1 decimal place precision

### Example Calculation

```
User has 3 existing ratings: 5, 4, 5 (average: 4.67)
New rating submitted: 3
New calculation: (5 + 4 + 5 + 3) / 4 = 4.25
User's averageRating updated to 4.25
User's ratingCount updated to 4
```

---

## Rating Distribution (Future Enhancement)

### Planned Feature

Display rating distribution on user profiles:

```json
{
  "averageRating": 4.5,
  "ratingCount": 100,
  "distribution": {
    "5": 60,  // 60 five-star ratings
    "4": 25,  // 25 four-star ratings
    "3": 10,  // 10 three-star ratings
    "2": 3,   // 3 two-star ratings
    "1": 2    // 2 one-star ratings
  }
}
```

This would provide more context than just the average rating.

---

## Testing

### Manual Testing with cURL

#### Submit a 5-star rating

```bash
curl -X POST http://localhost:5000/api/ratings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 5,
    "comment": "Excellent trader!"
  }'
```

#### Submit a 3-star rating (comment required)

```bash
curl -X POST http://localhost:5000/api/ratings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "stars": 3,
    "comment": "Book condition was acceptable but not as described."
  }'
```

#### Get user's ratings

```bash
curl -X GET http://localhost:5000/api/ratings/user/507f191e810c19729de860eb
```

#### Check if you've rated a trade

```bash
curl -X GET http://localhost:5000/api/ratings/trade/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer <token>"
```

### Automated Testing

```bash
# Run rating tests
cd server
npm test -- ratings.test.js
```

---

## Rate Limiting

### Rating Endpoints

- **Rate**: 1000 requests per 15 minutes per IP
- **Applies to**: All `/api/ratings/*` endpoints
- **Response when exceeded**:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

---

## Support

For issues or questions about the Ratings API:

1. Check this documentation
2. Review the [Trades API](./TRADES_API.md) for trade completion requirements
3. See [Authentication API](./AUTHENTICATION_API.md) for authentication details
4. Check server logs for detailed error messages

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
