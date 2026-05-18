# Notifications API Documentation

## 🔔 Overview

The BookVerse Notifications API provides in-app notification functionality to keep users informed about trade requests, messages, status updates, and other important events. Notifications help users stay engaged with their trading activity and respond promptly to time-sensitive actions.

### Base URL

```
http://localhost:5000/api/notifications
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required for**: All notification operations

### Key Features

- ✅ **Real-time Notifications**: Instant alerts for trade and message events
- ✅ **Multiple Notification Types**: Support for various event types
- ✅ **Unread Count**: Track unread notifications with badge count
- ✅ **Read Status Management**: Mark individual or all notifications as read
- ✅ **Bulk Actions**: Clear all notifications at once
- ✅ **Auto-Expiration**: Notifications automatically expire after 30 days
- ✅ **Rich Context**: Includes related user, trade, book, and wishlist information
- ✅ **Chronological Ordering**: Newest notifications displayed first

### Notification Flow

```
1. Event occurs (trade request, message, etc.)
2. Notification created → Stored in database
3. User sees unread count → Badge displayed
4. User views notifications → Marked as read
5. Auto-expire after 30 days → Database cleanup
```

---

## 📋 Table of Contents

1. [Get All Notifications](#1-get-all-notifications)
2. [Mark Notification as Read](#2-mark-notification-as-read)
3. [Mark All Notifications as Read](#3-mark-all-notifications-as-read)
4. [Clear All Notifications](#4-clear-all-notifications)
5. [Notification Types](#notification-types)
6. [Error Codes](#error-codes)
7. [Data Models](#data-models)

---

## 1. Get All Notifications

Retrieve all notifications for the authenticated user, sorted by creation date (newest first).

### Endpoint

```
GET /api/notifications
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
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "recipient": "507f191e810c19729de860ea",
      "type": "trade_request",
      "relatedTrade": {
        "_id": "507f1f77bcf86cd799439013",
        "proposer": "507f191e810c19729de860eb",
        "receiver": "507f191e810c19729de860ea",
        "status": "proposed"
      },
      "relatedUser": {
        "_id": "507f191e810c19729de860eb",
        "name": "Jane Smith",
        "city": "Boston",
        "averageRating": 4.8
      },
      "message": "Jane Smith proposed a trade for your book",
      "isRead": false,
      "createdAt": "2025-01-16T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "recipient": "507f191e810c19729de860ea",
      "type": "new_message",
      "relatedTrade": {
        "_id": "507f1f77bcf86cd799439014",
        "proposer": "507f191e810c19729de860ea",
        "receiver": "507f191e810c19729de860ec",
        "status": "accepted"
      },
      "relatedUser": {
        "_id": "507f191e810c19729de860ec",
        "name": "Bob Johnson",
        "city": "Chicago",
        "averageRating": 4.6
      },
      "message": "Bob Johnson sent you a message",
      "isRead": true,
      "createdAt": "2025-01-16T09:15:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439032",
      "recipient": "507f191e810c19729de860ea",
      "type": "trade_accepted",
      "relatedTrade": {
        "_id": "507f1f77bcf86cd799439015",
        "proposer": "507f191e810c19729de860ea",
        "receiver": "507f191e810c19729de860ed",
        "status": "accepted"
      },
      "relatedUser": {
        "_id": "507f191e810c19729de860ed",
        "name": "Alice Williams",
        "city": "Seattle",
        "averageRating": 5.0
      },
      "message": "Alice Williams accepted your trade proposal",
      "isRead": true,
      "createdAt": "2025-01-15T14:20:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

### Error Responses

#### Unauthorized

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

#### Internal Server Error

**Status Code**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "message": "An error occurred while fetching notifications",
    "code": "INTERNAL_ERROR"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Notifications are sorted by creation date in descending order (newest first)
- Related user information is populated (excluding password)
- Related trade information is populated if applicable
- The `unreadCount` field provides the total number of unread notifications
- Notifications older than 30 days are automatically deleted by MongoDB TTL index
- Empty array returned if no notifications exist

---

## 2. Mark Notification as Read

Mark a specific notification as read.

### Endpoint

```
PUT /api/notifications/:id/read
```

### Access

Private (requires authentication, notification recipient only)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Notification's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "recipient": "507f191e810c19729de860ea",
    "type": "trade_request",
    "relatedTrade": {
      "_id": "507f1f77bcf86cd799439013",
      "proposer": "507f191e810c19729de860eb",
      "receiver": "507f191e810c19729de860ea",
      "status": "proposed"
    },
    "relatedUser": {
      "_id": "507f191e810c19729de860eb",
      "name": "Jane Smith",
      "city": "Boston",
      "averageRating": 4.8
    },
    "message": "Jane Smith proposed a trade for your book",
    "isRead": true,
    "createdAt": "2025-01-16T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid Notification ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid notification ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid notification ID format",
        "param": "id",
        "location": "params"
      }
    ]
  }
}
```

#### Notification Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Notification not found",
    "code": "NOT_FOUND"
  }
}
```

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to update this notification",
    "code": "FORBIDDEN"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/notifications/507f1f77bcf86cd799439030/read \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the notification recipient can mark it as read
- If notification is already marked as read, the operation is idempotent (no error)
- The updated notification is returned with populated related fields
- This endpoint is useful for marking individual notifications as read when clicked

---

## 3. Mark All Notifications as Read

Mark all unread notifications as read for the authenticated user.

### Endpoint

```
PUT /api/notifications/read-all
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
  "message": "All notifications marked as read",
  "count": 5
}
```

### Error Responses

#### Unauthorized

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

#### Internal Server Error

**Status Code**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "message": "An error occurred while updating notifications",
    "code": "INTERNAL_ERROR"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Updates all unread notifications for the authenticated user
- The `count` field indicates how many notifications were updated
- Returns `count: 0` if all notifications were already read
- This is a bulk operation that's more efficient than marking notifications individually
- Useful for "Mark all as read" button in the UI

---

## 4. Clear All Notifications

Delete all notifications for the authenticated user.

### Endpoint

```
DELETE /api/notifications/clear-all
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
  "message": "All notifications cleared",
  "count": 12
}
```

### Error Responses

#### Unauthorized

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

#### Internal Server Error

**Status Code**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "message": "An error occurred while clearing notifications",
    "code": "INTERNAL_ERROR"
  }
}
```

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/notifications/clear-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Permanently deletes all notifications for the authenticated user
- The `count` field indicates how many notifications were deleted
- Returns `count: 0` if no notifications existed
- This operation cannot be undone
- Consider showing a confirmation dialog before clearing in the UI
- Useful for "Clear all" button in the notification panel

---

## Notification Types

The BookVerse platform supports multiple notification types to cover various user interactions and events.

### Trade-Related Notifications

#### `trade_request`

**Trigger**: When a user receives a new trade proposal

**Message Format**: `{userName} proposed a trade for your book`

**Related Fields**:
- `relatedTrade`: The proposed trade
- `relatedUser`: The user who proposed the trade

**User Action**: View trade details and accept/decline

---

#### `trade_accepted`

**Trigger**: When a user's trade proposal is accepted

**Message Format**: `{userName} accepted your trade proposal`

**Related Fields**:
- `relatedTrade`: The accepted trade
- `relatedUser`: The user who accepted the trade

**User Action**: Start messaging to coordinate exchange

---

#### `trade_declined`

**Trigger**: When a user's trade proposal is declined

**Message Format**: `{userName} declined your trade proposal`

**Related Fields**:
- `relatedTrade`: The declined trade
- `relatedUser`: The user who declined the trade

**User Action**: Acknowledge and potentially propose different trade

---

#### `trade_completed`

**Trigger**: When a trade is marked as complete

**Message Format**: `{userName} marked your trade as complete`

**Related Fields**:
- `relatedTrade`: The completed trade
- `relatedUser`: The user who marked it complete

**User Action**: Confirm completion and submit rating

---

### Communication Notifications

#### `new_message`

**Trigger**: When a user receives a new message in a trade chat

**Message Format**: `{userName} sent you a message`

**Related Fields**:
- `relatedTrade`: The trade containing the message
- `relatedUser`: The user who sent the message

**User Action**: Open chat to read and respond to message

---

### Wishlist Notifications

#### `wishlist_match`

**Trigger**: When a book matching the user's wishlist becomes available

**Message Format**: `A book from your wishlist is now available: {bookTitle}`

**Related Fields**:
- `relatedBook`: The available book
- `relatedWishlist`: The wishlist item that matched
- `relatedUser`: The book owner

**User Action**: View book details and propose trade

---

#### `wishlist_available`

**Trigger**: When a perfect ISBN match for a wishlist item is listed

**Message Format**: `Perfect match found for your wishlist: {bookTitle}`

**Related Fields**:
- `relatedBook`: The matching book
- `relatedWishlist`: The wishlist item
- `relatedUser`: The book owner

**User Action**: View book and initiate trade

---

#### `wishlist_trade_hint`

**Trigger**: When a user has a book that someone else wants (wishlist match)

**Message Format**: `{userName} is looking for a book you have: {bookTitle}`

**Related Fields**:
- `relatedBook`: The user's book
- `relatedUser`: The user who wants the book

**User Action**: View the interested user's profile and books

---

### Location-Based Notifications

#### `local_book_listed`

**Trigger**: When a book is listed in the user's city

**Message Format**: `New book listed in {city}: {bookTitle}`

**Related Fields**:
- `relatedBook`: The newly listed book
- `relatedUser`: The book owner

**User Action**: Browse local books and propose trades

---

#### `nearby_user_wants_book`

**Trigger**: When a nearby user adds a book to their wishlist that matches user's inventory

**Message Format**: `A user in {city} is looking for your book: {bookTitle}`

**Related Fields**:
- `relatedBook`: The user's book
- `relatedUser`: The nearby user

**User Action**: View user's profile and initiate contact

---

#### `local_activity_digest`

**Trigger**: Periodic digest of local trading activity

**Message Format**: `{count} new books and trades in your area this week`

**Related Fields**:
- None (summary notification)

**User Action**: Browse local activity

---

## Error Codes

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |

### Resource Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Notification does not exist |

### Authorization Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User not authorized for this action |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### Notification Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  recipient: string;              // User ObjectId (notification recipient)
  type: NotificationType;         // Notification type (see Notification Types)
  relatedTrade?: Trade | string;  // Related trade object or ObjectId (optional)
  relatedUser?: User | string;    // Related user object or ObjectId (optional)
  relatedBook?: Book | string;    // Related book object or ObjectId (optional)
  relatedWishlist?: Wishlist | string; // Related wishlist object or ObjectId (optional)
  message: string;                // Human-readable notification message
  isRead: boolean;                // Read status (default: false)
  createdAt: Date;                // Notification creation timestamp
}
```

### Notification Types

```typescript
type NotificationType = 
  | 'trade_request'           // New trade proposal received
  | 'trade_accepted'          // Trade proposal accepted
  | 'trade_declined'          // Trade proposal declined
  | 'trade_completed'         // Trade marked as complete
  | 'new_message'             // New message in trade chat
  | 'wishlist_match'          // Book matching wishlist available
  | 'wishlist_available'      // Perfect ISBN match for wishlist
  | 'wishlist_trade_hint'     // Someone wants a book you have
  | 'local_book_listed'       // New book in user's city
  | 'nearby_user_wants_book'  // Nearby user wants your book
  | 'local_activity_digest';  // Local activity summary
```

### User Object (in Notification Response)

```typescript
{
  _id: string;                    // User's MongoDB ObjectId
  name: string;                   // User's full name
  city?: string;                  // City (only if showCity: true)
  averageRating: number;          // Average rating (0-5)
}
```

### Trade Object (in Notification Response)

```typescript
{
  _id: string;                    // Trade's MongoDB ObjectId
  proposer: string;               // Proposer's user ID
  receiver: string;               // Receiver's user ID
  status: string;                 // Trade status (proposed, accepted, declined, completed)
}
```

---

## Notification Lifecycle Example

### 1. Jane proposes a trade to John

```bash
POST /api/trades
{
  "requestedBook": "507f1f77bcf86cd799439011",
  "offeredBook": "507f1f77bcf86cd799439012"
}
```

**Result**: Notification created for John with type `trade_request`

### 2. John checks his notifications

```bash
GET /api/notifications
```

**Result**: Returns all notifications including the new trade request (unread)

### 3. John marks the notification as read

```bash
PUT /api/notifications/507f1f77bcf86cd799439030/read
```

**Result**: Notification marked as read, unread count decreases

### 4. John accepts the trade

```bash
PUT /api/trades/507f1f77bcf86cd799439013/accept
```

**Result**: Notification created for Jane with type `trade_accepted`

### 5. Jane sends a message

```bash
POST /api/messages
{
  "trade": "507f1f77bcf86cd799439013",
  "content": "Great! When can we meet?"
}
```

**Result**: Notification created for John with type `new_message`

### 6. John marks all notifications as read

```bash
PUT /api/notifications/read-all
```

**Result**: All unread notifications marked as read

### 7. John clears old notifications

```bash
DELETE /api/notifications/clear-all
```

**Result**: All notifications permanently deleted

---

## Best Practices

### For Frontend Developers

1. **Real-time Updates**: Poll the notifications endpoint every 30-60 seconds for new notifications
2. **Unread Badge**: Display the `unreadCount` in a badge on the notification bell icon
3. **Auto-mark Read**: Mark notifications as read when user clicks on them
4. **Notification Panel**: Show recent notifications in a dropdown panel
5. **Action Links**: Make notifications clickable to navigate to related content
6. **Confirmation**: Show confirmation dialog before clearing all notifications
7. **Empty States**: Display helpful message when no notifications exist
8. **Timestamps**: Display relative timestamps (e.g., "5 minutes ago")
9. **Grouping**: Consider grouping notifications by type or date
10. **Sound/Visual**: Consider subtle sound or visual cue for new notifications

### For Backend Integration

1. **Authentication**: Always include JWT token in Authorization header
2. **Validation**: Validate notification ID format before requests
3. **Error Handling**: Handle all error codes with user-friendly messages
4. **Polling**: Implement exponential backoff for polling to reduce server load
5. **Bulk Operations**: Use bulk endpoints (read-all, clear-all) when appropriate

### Security Considerations

1. **Access Control**: Users can only access their own notifications
2. **Authorization**: Each request validates user is the notification recipient
3. **Privacy**: Related user information respects privacy settings
4. **Auto-Expiration**: Notifications automatically deleted after 30 days
5. **Input Validation**: All inputs validated and sanitized

---

## Integration with Other APIs

### Trades API

- Trade events automatically create notifications
- Notification types: `trade_request`, `trade_accepted`, `trade_declined`, `trade_completed`
- Related trade information included in notification

### Messages API

- New messages automatically create notifications
- Notification type: `new_message`
- Notification includes sender information and trade reference

### Wishlist API

- Wishlist matches create notifications
- Notification types: `wishlist_match`, `wishlist_available`, `wishlist_trade_hint`
- Related book and wishlist information included

### Books API

- New book listings can trigger location-based notifications
- Notification types: `local_book_listed`, `nearby_user_wants_book`
- Related book information included

---

## Future Enhancements

### Planned Features

1. **Push Notifications**: Browser push notifications for real-time alerts
2. **Email Notifications**: Optional email notifications for important events
3. **Notification Preferences**: User-configurable notification settings per type
4. **Notification Grouping**: Group similar notifications (e.g., "3 new messages")
5. **Notification History**: Archive old notifications instead of deleting
6. **Rich Notifications**: Include images and action buttons
7. **Notification Scheduling**: Schedule digest notifications
8. **WebSocket Integration**: Real-time notification delivery without polling

### Performance Optimizations

1. **Pagination**: Implement pagination for large notification lists
2. **Caching**: Cache recent notifications to reduce database queries
3. **Indexing**: Optimize database indexes for faster queries
4. **Batch Processing**: Batch notification creation for efficiency

---

## Testing

### Manual Testing with cURL

#### Get All Notifications

```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer <token>"
```

#### Mark Notification as Read

```bash
curl -X PUT http://localhost:5000/api/notifications/507f1f77bcf86cd799439030/read \
  -H "Authorization: Bearer <token>"
```

#### Mark All as Read

```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer <token>"
```

#### Clear All Notifications

```bash
curl -X DELETE http://localhost:5000/api/notifications/clear-all \
  -H "Authorization: Bearer <token>"
```

### Automated Testing

```bash
# Run notification tests
cd server
npm test -- notifications.test.js
```

---

## Rate Limiting

### Notification Endpoints

- **Rate**: 1000 requests per 15 minutes per IP
- **Applies to**: All `/api/notifications/*` endpoints
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

## Database Indexes

### Performance Optimization

The Notification model includes the following indexes for optimal query performance:

1. **Single Index on `recipient`**: Fast lookup of user's notifications
2. **Compound Index on `recipient` and `isRead`**: Efficient filtering of unread notifications
3. **TTL Index on `createdAt`**: Automatic deletion of notifications after 30 days (2,592,000 seconds)

---

## Support

For issues or questions about the Notifications API:

1. Check this documentation
2. Review the [Trades API](./TRADES_API.md) for trade-related notifications
3. See [Messages API](./MESSAGES_API.md) for message notifications
4. Check [Authentication API](./AUTHENTICATION_API.md) for authentication details
5. Check server logs for detailed error messages

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
