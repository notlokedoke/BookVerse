# Messages API Documentation

## 💬 Overview

The BookVerse Messages API provides secure trade-specific messaging functionality for users to communicate and coordinate book exchanges. Messages are only available for accepted trades and are restricted to the two parties involved in the trade.

### Base URL

```
http://localhost:5000/api/messages
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required for**: All message operations

### Key Features

- ✅ **Trade-Specific Messaging**: Messages are tied to specific trades
- ✅ **Access Control**: Only trade participants can send/view messages
- ✅ **Status Validation**: Messaging only allowed for accepted trades
- ✅ **Read Receipts**: Automatic read status tracking
- ✅ **Auto-Mark Read**: Messages marked as read when fetched by recipient
- ✅ **Unread Count**: Track unread messages per trade
- ✅ **Message Deletion**: Senders can delete their own messages
- ✅ **Automatic Notifications**: Recipients notified of new messages
- ✅ **Input Sanitization**: XSS prevention on all message content

### Message Flow

```
1. Trade accepted → Chat enabled
2. User sends message → Message stored
3. Recipient notified → Notification created
4. Recipient fetches messages → Auto-marked as read
5. Users coordinate exchange → Physical meetup
```

---

## 📋 Table of Contents

1. [Send Message](#1-send-message)
2. [Get Trade Messages](#2-get-trade-messages)
3. [Mark Message as Read](#3-mark-message-as-read)
4. [Get Unread Count](#4-get-unread-count)
5. [Delete Message](#5-delete-message)
6. [Error Codes](#error-codes)
7. [Data Models](#data-models)

---

## 1. Send Message

Send a message in a trade chat.

### Endpoint

```
POST /api/messages
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
  "content": "Hi! When would be a good time to meet for the book exchange?"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `trade` | string | Yes | Trade's MongoDB ObjectId | Valid 24-character hex string |
| `content` | string | Yes | Message content | 1-1000 characters, sanitized |

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "trade": "507f1f77bcf86cd799439013",
    "sender": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5
    },
    "content": "Hi! When would be a good time to meet for the book exchange?",
    "read": false,
    "readAt": null,
    "createdAt": "2025-01-16T10:30:00.000Z"
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

#### Message Content Too Long

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Message content must be between 1 and 1000 characters",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Message content must be between 1 and 1000 characters",
        "param": "content",
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

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to send messages in this trade",
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
    "message": "Messages can only be sent for accepted trades",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "content": "Hi! When would be a good time to meet for the book exchange?"
  }'
```

### Notes

- Only trade participants (proposer or receiver) can send messages
- Trade status must be "accepted" to send messages
- Message content is automatically trimmed and sanitized to prevent XSS
- A notification is automatically created for the recipient
- Sender information is populated in the response (excluding password)
- Maximum message length is 1000 characters
- Empty or whitespace-only messages are rejected

---

## 2. Get Trade Messages

Retrieve all messages for a specific trade in chronological order.

### Endpoint

```
GET /api/messages/trade/:tradeId
```

### Access

Private (requires authentication, trade participants only)

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
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "trade": "507f1f77bcf86cd799439013",
      "sender": {
        "_id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "city": "New York",
        "averageRating": 4.5
      },
      "content": "Hi! When would be a good time to meet for the book exchange?",
      "read": true,
      "readAt": "2025-01-16T10:35:00.000Z",
      "createdAt": "2025-01-16T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "trade": "507f1f77bcf86cd799439013",
      "sender": {
        "_id": "507f191e810c19729de860eb",
        "name": "Jane Smith",
        "city": "Boston",
        "averageRating": 4.8
      },
      "content": "How about tomorrow at 3pm at the Central Library?",
      "read": true,
      "readAt": "2025-01-16T10:40:00.000Z",
      "createdAt": "2025-01-16T10:35:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "trade": "507f1f77bcf86cd799439013",
      "sender": {
        "_id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "city": "New York",
        "averageRating": 4.5
      },
      "content": "Perfect! See you there.",
      "read": true,
      "readAt": "2025-01-16T10:45:00.000Z",
      "createdAt": "2025-01-16T10:40:00.000Z"
    }
  ]
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
    "message": "You are not authorized to view messages for this trade",
    "code": "NOT_AUTHORIZED"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/messages/trade/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only trade participants (proposer or receiver) can view messages
- Messages are returned in chronological order (oldest first)
- Sender information is fully populated (excluding password)
- **Auto-mark as read**: Unread messages from the other party are automatically marked as read when fetched
- The `read` and `readAt` fields reflect the updated status after auto-marking
- Empty array returned if no messages exist for the trade
- This endpoint should be polled periodically for new messages (or use WebSocket in future)

---

## 3. Mark Message as Read

Manually mark a specific message as read (recipient only).

### Endpoint

```
PATCH /api/messages/:id/read
```

### Access

Private (requires authentication, recipient only)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Message's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "trade": {
      "_id": "507f1f77bcf86cd799439013",
      "proposer": "507f191e810c19729de860ea",
      "receiver": "507f191e810c19729de860eb"
    },
    "sender": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "city": "New York",
      "averageRating": 4.5
    },
    "content": "Hi! When would be a good time to meet for the book exchange?",
    "read": true,
    "readAt": "2025-01-16T10:35:00.000Z",
    "createdAt": "2025-01-16T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid Message ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid message ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid message ID format",
        "param": "id",
        "location": "params"
      }
    ]
  }
}
```

#### Message Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Message not found",
    "code": "MESSAGE_NOT_FOUND"
  }
}
```

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to mark this message as read",
    "code": "NOT_AUTHORIZED"
  }
}
```

#### Cannot Mark Own Message

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "You cannot mark your own message as read",
    "code": "CANNOT_MARK_OWN_MESSAGE"
  }
}
```

### Example Request

```bash
curl -X PATCH http://localhost:5000/api/messages/507f1f77bcf86cd799439020/read \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the recipient (not the sender) can mark a message as read
- User must be a participant in the trade (proposer or receiver)
- If message is already marked as read, the operation is idempotent (no error)
- The `readAt` timestamp is set to the current time when marked as read
- This endpoint is rarely needed since messages are auto-marked as read when fetched
- Useful for marking individual messages read without fetching all messages

---

## 4. Get Unread Count

Get the count of unread messages for a specific trade.

### Endpoint

```
GET /api/messages/trade/:tradeId/unread-count
```

### Access

Private (requires authentication, trade participants only)

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
    "tradeId": "507f1f77bcf86cd799439013",
    "unreadCount": 3
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
    "message": "You are not authorized to view unread count for this trade",
    "code": "NOT_AUTHORIZED"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/messages/trade/507f1f77bcf86cd799439013/unread-count \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only trade participants (proposer or receiver) can view unread count
- Count only includes messages where the user is NOT the sender
- Count only includes messages with `read: false`
- Returns 0 if all messages are read or no messages exist
- Useful for displaying notification badges in the UI
- Poll this endpoint periodically to update unread counts in real-time

---

## 5. Delete Message

Delete a message (sender only).

### Endpoint

```
DELETE /api/messages/:id
```

### Access

Private (requires authentication, sender only)

### Request Headers

```
Authorization: Bearer <jwt_token>
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Message's MongoDB ObjectId |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### Error Responses

#### Invalid Message ID Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid message ID format",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Invalid message ID format",
        "param": "id",
        "location": "params"
      }
    ]
  }
}
```

#### Message Not Found

**Status Code**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Message not found",
    "code": "MESSAGE_NOT_FOUND"
  }
}
```

#### Not Authorized

**Status Code**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only delete your own messages",
    "code": "NOT_AUTHORIZED"
  }
}
```

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/messages/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- Only the message sender can delete their own messages
- Message is permanently deleted from the database
- Deletion cannot be undone
- The other party will no longer see the deleted message
- Consider showing a confirmation dialog before deletion in the UI

---

## Error Codes

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_MESSAGE_ID` | 400 | Message ID format is invalid |
| `INVALID_TRADE_ID` | 400 | Trade ID format is invalid |

### Resource Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MESSAGE_NOT_FOUND` | 404 | Message does not exist |
| `TRADE_NOT_FOUND` | 404 | Trade does not exist |

### Authorization Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_AUTHORIZED` | 403 | User not authorized for this action |
| `CANNOT_MARK_OWN_MESSAGE` | 400 | Cannot mark own message as read |

### Trade Status Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TRADE_STATUS` | 400 | Trade status does not allow messaging |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### Message Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  trade: Trade | string;          // Trade object or ObjectId
  sender: User | string;          // User object or ObjectId (message sender)
  content: string;                // Message content (1-1000 characters)
  read: boolean;                  // Read status (default: false)
  readAt: Date | null;            // When message was read (null if unread)
  createdAt: Date;                // Message creation timestamp
}
```

### User Object (in Message Response)

```typescript
{
  _id: string;                    // User's MongoDB ObjectId
  name: string;                   // User's full name
  city?: string;                  // City (only if showCity: true)
  averageRating: number;          // Average rating (0-5)
}
```

### Trade Object (in Message Response)

```typescript
{
  _id: string;                    // Trade's MongoDB ObjectId
  proposer: string;               // Proposer's user ID
  receiver: string;               // Receiver's user ID
}
```

### Unread Count Response

```typescript
{
  tradeId: string;                // Trade's MongoDB ObjectId
  unreadCount: number;            // Number of unread messages
}
```

---

## Message Lifecycle Example

### 1. Trade is accepted

```bash
PUT /api/trades/507f1f77bcf86cd799439013/accept
```

**Result**: Trade status changes to "accepted", messaging enabled

### 2. John sends first message

```bash
POST /api/messages
{
  "trade": "507f1f77bcf86cd799439013",
  "content": "Hi! When would be a good time to meet?"
}
```

**Result**: Message created with `read: false`, Jane receives notification

### 3. Jane checks unread count

```bash
GET /api/messages/trade/507f1f77bcf86cd799439013/unread-count
```

**Result**: Returns `{ unreadCount: 1 }`

### 4. Jane fetches messages

```bash
GET /api/messages/trade/507f1f77bcf86cd799439013
```

**Result**: Messages returned, John's message auto-marked as read

### 5. Jane replies

```bash
POST /api/messages
{
  "trade": "507f1f77bcf86cd799439013",
  "content": "How about tomorrow at 3pm at the Central Library?"
}
```

**Result**: Message created, John receives notification

### 6. John deletes a typo message

```bash
DELETE /api/messages/507f1f77bcf86cd799439022
```

**Result**: Message permanently deleted

---

## Best Practices

### For Frontend Developers

1. **Real-time Updates**: Poll the messages endpoint every 5-10 seconds for new messages
2. **Unread Badges**: Use the unread count endpoint to display notification badges
3. **Auto-scroll**: Scroll to bottom when new messages arrive
4. **Optimistic UI**: Show sent messages immediately, handle errors gracefully
5. **Confirmation**: Show confirmation dialog before deleting messages
6. **Character Counter**: Display remaining characters (1000 max) in message input
7. **Empty States**: Show helpful message when no messages exist yet
8. **Timestamps**: Display relative timestamps (e.g., "2 minutes ago")

### For Backend Integration

1. **Authentication**: Always include JWT token in Authorization header
2. **Validation**: Validate trade ID and message ID formats before requests
3. **Error Handling**: Handle all error codes with user-friendly messages
4. **Sanitization**: Message content is automatically sanitized server-side
5. **Polling**: Implement exponential backoff for polling to reduce server load
6. **Notification Integration**: Expect automatic notifications on new messages

### Security Considerations

1. **Access Control**: Only trade participants can send/view messages
2. **Trade Status**: Messaging only allowed for accepted trades
3. **XSS Prevention**: All message content is sanitized with DOMPurify
4. **Input Validation**: Message length limited to 1000 characters
5. **Authorization**: Each request validates user is part of the trade
6. **Privacy**: Sender information respects user privacy settings

---

## Integration with Other APIs

### Trades API

- Messages are only available for trades with status "accepted"
- Trade ID is required for all message operations
- Trade participants are validated for all message actions

### Notifications API

- New messages automatically create notifications for recipients
- Notification type: `new_message`
- Notification includes sender information and trade reference

### Users API

- Sender information in messages respects privacy settings
- City only shown if `privacySettings.showCity: true`
- Email never exposed in message responses

---

## Future Enhancements

### Planned Features

1. **WebSocket Integration**: Real-time message delivery without polling
2. **Typing Indicators**: Show when the other user is typing
3. **Message Editing**: Allow users to edit their own messages
4. **Message Reactions**: Add emoji reactions to messages
5. **File Attachments**: Support image sharing for book condition photos
6. **Message Search**: Search within conversation history
7. **Message Threading**: Reply to specific messages
8. **Read Receipts UI**: Show "seen" status with timestamp

### Performance Optimizations

1. **Pagination**: Implement pagination for long conversations
2. **Caching**: Cache recent messages to reduce database queries
3. **Compression**: Compress message content for storage efficiency
4. **Indexing**: Optimize database indexes for faster queries

---

## Testing

### Manual Testing with cURL

#### Send a Message

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "507f1f77bcf86cd799439013",
    "content": "Hello! Looking forward to the exchange."
  }'
```

#### Get Trade Messages

```bash
curl -X GET http://localhost:5000/api/messages/trade/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer <token>"
```

#### Get Unread Count

```bash
curl -X GET http://localhost:5000/api/messages/trade/507f1f77bcf86cd799439013/unread-count \
  -H "Authorization: Bearer <token>"
```

#### Mark Message as Read

```bash
curl -X PATCH http://localhost:5000/api/messages/507f1f77bcf86cd799439020/read \
  -H "Authorization: Bearer <token>"
```

#### Delete Message

```bash
curl -X DELETE http://localhost:5000/api/messages/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer <token>"
```

### Automated Testing

```bash
# Run message tests
cd server
npm test -- messages.test.js
```

---

## Rate Limiting

### Message Endpoints

- **Rate**: 1000 requests per 15 minutes per IP
- **Applies to**: All `/api/messages/*` endpoints
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

For issues or questions about the Messages API:

1. Check this documentation
2. Review the [Trades API](./TRADES_API.md) for trade status requirements
3. See [Authentication API](./AUTHENTICATION_API.md) for authentication details
4. Check server logs for detailed error messages

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
