# API Error Response Documentation

## 📋 Overview

This document provides comprehensive documentation for all error responses in the BookVerse API. Understanding these error codes and their meanings will help you handle errors gracefully in your application.

## 🎯 Error Response Format

All API errors follow a consistent, standardized format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {}  // Optional: Additional context (e.g., validation errors)
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Always `false` for error responses |
| `error.message` | String | Human-readable error description for display to users |
| `error.code` | String | Machine-readable error code for programmatic handling |
| `error.details` | Object/Array | Optional additional context (validation errors, field-specific issues) |

## 📊 HTTP Status Codes

The BookVerse API uses standard HTTP status codes to indicate the type of error:

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| **400** | Bad Request | Invalid input data, validation failures, missing required fields |
| **401** | Unauthorized | Missing or invalid JWT token, authentication required |
| **403** | Forbidden | User lacks permission to access/modify resource |
| **404** | Not Found | Requested resource doesn't exist |
| **409** | Conflict | Resource conflict (duplicate email, duplicate rating, etc.) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unexpected server errors, database failures |
| **503** | Service Unavailable | External service temporarily unavailable |

## 🔐 Authentication Errors (401, 403)

### Missing or Invalid Token

**Status Code:** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Authentication required. Please provide a valid token.",
    "code": "NO_TOKEN"
  }
}
```

**When:** No JWT token provided in Authorization header  
**Solution:** Include `Authorization: Bearer <token>` header in request

---

```json
{
  "success": false,
  "error": {
    "message": "Invalid token",
    "code": "INVALID_TOKEN"
  }
}
```

**When:** JWT token is malformed, expired, or invalid  
**Solution:** Re-authenticate to get a new token

---

### Invalid Credentials

**Status Code:** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

**When:** Email or password is incorrect during login  
**Solution:** Verify credentials and try again

---

### Incorrect Password

**Status Code:** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Current password is incorrect",
    "code": "INVALID_PASSWORD"
  }
}
```

**When:** Current password is wrong during password change  
**Solution:** Verify the current password

---

### Unauthorized Access

**Status Code:** `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "message": "You can only update your own book listings",
    "code": "UNAUTHORIZED_UPDATE"
  }
}
```

**When:** User attempts to modify a resource they don't own  
**Solution:** Only modify your own resources

---

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to update this notification",
    "code": "FORBIDDEN"
  }
}
```

**When:** User attempts to access another user's notification  
**Solution:** Only access your own notifications

---

```json
{
  "success": false,
  "error": {
    "message": "Only the receiver can accept this trade",
    "code": "NOT_AUTHORIZED"
  }
}
```

**When:** User attempts to accept a trade they didn't receive  
**Solution:** Only the trade receiver can accept trades

## ✅ Validation Errors (400)

### Missing Required Fields

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Please provide all required fields: name, email, password, and city",
    "code": "MISSING_FIELDS",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

**When:** Required fields are missing from request  
**Solution:** Include all required fields in request body

---

### Validation Error

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 8 characters long",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters long"
      }
    ]
  }
}
```

**When:** Input data fails validation rules  
**Solution:** Fix the validation errors and resubmit

**Common Validation Errors:**
- Email format invalid
- Password too short (< 8 characters)
- Field exceeds maximum length
- Invalid enum value (e.g., book condition)
- Invalid data type (e.g., string instead of number)

---

### Invalid Format

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid book ID format",
    "code": "INVALID_BOOK_ID"
  }
}
```

**When:** ID parameter doesn't match expected format (MongoDB ObjectId)  
**Solution:** Ensure IDs are valid 24-character hexadecimal strings

---

```json
{
  "success": false,
  "error": {
    "message": "Invalid ISBN format. ISBN must be 10 or 13 digits.",
    "code": "INVALID_ISBN_FORMAT"
  }
}
```

**When:** ISBN doesn't match expected format  
**Solution:** Provide a valid 10 or 13-digit ISBN

---

### No Update Fields

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Please provide at least one field to update (name, city, bio, or privacySettings)",
    "code": "NO_UPDATE_FIELDS"
  }
}
```

**When:** Update request contains no fields to update  
**Solution:** Include at least one field to update

---

### Same Password

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "New password must be different from current password",
    "code": "SAME_PASSWORD"
  }
}
```

**When:** New password is identical to current password  
**Solution:** Choose a different password

---

### OAuth Account

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "This account uses Google sign-in. Please log in with Google.",
    "code": "OAUTH_ACCOUNT"
  }
}
```

**When:** Attempting password operations on OAuth-only account  
**Solution:** Use Google sign-in for this account

---

### Already Verified

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Email is already verified",
    "code": "ALREADY_VERIFIED"
  }
}
```

**When:** Attempting to verify an already verified email  
**Solution:** No action needed, email is already verified

## 🔍 Resource Not Found Errors (404)

### User Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

**When:** Requested user doesn't exist  
**Solution:** Verify the user ID is correct

---

### Book Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Book not found",
    "code": "BOOK_NOT_FOUND"
  }
}
```

**When:** Requested book doesn't exist or ISBN lookup fails  
**Solution:** Verify the book ID or ISBN is correct

---

### Trade Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Trade not found",
    "code": "TRADE_NOT_FOUND"
  }
}
```

**When:** Requested trade doesn't exist  
**Solution:** Verify the trade ID is correct

---

### Message Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Message not found",
    "code": "MESSAGE_NOT_FOUND"
  }
}
```

**When:** Requested message doesn't exist  
**Solution:** Verify the message ID is correct

---

### Rating Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Rating not found",
    "code": "RATING_NOT_FOUND"
  }
}
```

**When:** Requested rating doesn't exist  
**Solution:** Verify the rating ID is correct

---

### Notification Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Notification not found",
    "code": "NOT_FOUND"
  }
}
```

**When:** Requested notification doesn't exist  
**Solution:** Verify the notification ID is correct

---

### Wishlist Item Not Found

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Wishlist item not found",
    "code": "WISHLIST_NOT_FOUND"
  }
}
```

**When:** Requested wishlist item doesn't exist  
**Solution:** Verify the wishlist item ID is correct

## ⚠️ Conflict Errors (409)

### Email Already Exists

**Status Code:** `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "An account with this email already exists",
    "code": "EMAIL_EXISTS"
  }
}
```

**When:** Attempting to register with an email that's already in use  
**Solution:** Use a different email or log in with existing account

---

### Duplicate Rating

**Status Code:** `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "You have already rated this trade",
    "code": "DUPLICATE_RATING"
  }
}
```

**When:** Attempting to rate the same trade twice  
**Solution:** Each user can only rate a trade once

---

### Duplicate Wishlist Item

**Status Code:** `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "This book is already in your wishlist",
    "code": "DUPLICATE_WISHLIST"
  }
}
```

**When:** Attempting to add a book that's already in wishlist  
**Solution:** Book is already in your wishlist

## 🚫 Business Logic Errors (400, 403)

### Trade-Related Errors

```json
{
  "success": false,
  "error": {
    "message": "You can only offer books that you own",
    "code": "NOT_BOOK_OWNER"
  }
}
```

**When:** Attempting to offer a book you don't own in a trade  
**Solution:** Only offer books from your own collection

---

```json
{
  "success": false,
  "error": {
    "message": "You cannot request your own book",
    "code": "CANNOT_REQUEST_OWN_BOOK"
  }
}
```

**When:** Attempting to trade for your own book  
**Solution:** You can't trade with yourself

---

```json
{
  "success": false,
  "error": {
    "message": "Requested book is not available for trade",
    "code": "REQUESTED_BOOK_UNAVAILABLE"
  }
}
```

**When:** Book is marked as unavailable or involved in active trade  
**Solution:** Choose a different book that's available

---

```json
{
  "success": false,
  "error": {
    "message": "Cannot accept trade with status \"declined\". Only proposed trades can be accepted.",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

**When:** Attempting to perform action on trade with wrong status  
**Solution:** Trades can only be accepted when status is "proposed"

---

### Rating-Related Errors

```json
{
  "success": false,
  "error": {
    "message": "Cannot rate trade with status \"accepted\". Only completed trades can be rated.",
    "code": "TRADE_NOT_COMPLETED"
  }
}
```

**When:** Attempting to rate a trade that hasn't been completed  
**Solution:** Wait until trade is marked as complete

---

### Message-Related Errors

```json
{
  "success": false,
  "error": {
    "message": "Messages can only be sent for accepted trades",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

**When:** Attempting to send message in trade that isn't accepted  
**Solution:** Wait for trade to be accepted before messaging

---

```json
{
  "success": false,
  "error": {
    "message": "You cannot mark your own message as read",
    "code": "CANNOT_MARK_OWN_MESSAGE"
  }
}
```

**When:** Attempting to mark your own message as read  
**Solution:** Only mark received messages as read

---

### File Upload Errors

```json
{
  "success": false,
  "error": {
    "message": "File too large. Maximum size is 5MB.",
    "code": "FILE_TOO_LARGE"
  }
}
```

**When:** Uploaded file exceeds 5MB limit  
**Solution:** Compress or resize image before uploading

---

```json
{
  "success": false,
  "error": {
    "message": "Invalid file type. Only JPEG, PNG and WebP are allowed.",
    "code": "INVALID_FILE_TYPE"
  }
}
```

**When:** Uploaded file is not an allowed image format  
**Solution:** Upload JPEG, PNG, or WebP images only

---

```json
{
  "success": false,
  "error": {
    "message": "At least one image is required. Please upload front/back images or use ISBN lookup.",
    "code": "IMAGE_REQUIRED"
  }
}
```

**When:** Creating book without any image  
**Solution:** Upload at least one image or use ISBN lookup

## 🚦 Rate Limiting Errors (429)

### Rate Limit Exceeded

**Status Code:** `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**When:** General rate limit exceeded (100 requests per 15 minutes)  
**Solution:** Wait before making more requests

---

```json
{
  "success": false,
  "error": {
    "message": "Too many authentication attempts. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**When:** Authentication rate limit exceeded  
**Solution:** Wait 15 minutes before attempting to authenticate again

---

```json
{
  "success": false,
  "error": {
    "message": "Too many contact form submissions. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**When:** Contact form rate limit exceeded (5 submissions per hour)  
**Solution:** Wait before submitting another contact form

## 💥 Server Errors (500, 503)

### Internal Server Error

**Status Code:** `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "message": "An unexpected error occurred. Please try again later.",
    "code": "INTERNAL_ERROR"
  }
}
```

**When:** Unexpected server error, database failure, or unhandled exception  
**Solution:** Try again later. If problem persists, contact support

**Note:** In production, technical details are hidden for security. Check server logs for debugging.

---

### Service Unavailable

**Status Code:** `503 Service Unavailable`

```json
{
  "success": false,
  "error": {
    "message": "Too many requests to Open Library. Please try again in a moment.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**When:** External service (Open Library, Google Books) is temporarily unavailable  
**Solution:** Wait a moment and try again

---

### Request Timeout

**Status Code:** `408 Request Timeout`

```json
{
  "success": false,
  "error": {
    "message": "Request timeout. Please try again.",
    "code": "REQUEST_TIMEOUT"
  }
}
```

**When:** External API request times out  
**Solution:** Try again with a stable internet connection


## 📚 Error Codes by Endpoint Category

### Authentication Endpoints (`/api/auth`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `NO_TOKEN` | 401 | No JWT token provided |
| `INVALID_TOKEN` | 401 | JWT token is invalid or expired |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `INVALID_PASSWORD` | 401 | Current password is incorrect |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `MISSING_FIELDS` | 400 | Required fields missing |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NO_UPDATE_FIELDS` | 400 | No fields provided for update |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `SAME_PASSWORD` | 400 | New password same as current |
| `OAUTH_ACCOUNT` | 400 | Account uses OAuth (no password) |
| `ALREADY_VERIFIED` | 400 | Email already verified |
| `PASSWORD_REQUIRED` | 400 | Password required for operation |
| `INTERNAL_ERROR` | 500 | Server error |

### Books Endpoints (`/api/books`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `MISSING_REQUIRED_FIELDS` | 400 | Required fields missing |
| `IMAGE_REQUIRED` | 400 | At least one image required |
| `INVALID_BOOK_ID` | 400 | Book ID format invalid |
| `INVALID_ISBN_FORMAT` | 400 | ISBN format invalid |
| `BOOK_NOT_FOUND` | 404 | Book doesn't exist |
| `UNAUTHORIZED_UPDATE` | 403 | Can't update others' books |
| `UNAUTHORIZED_DELETE` | 403 | Can't delete others' books |
| `INVALID_TITLE` | 400 | Title is empty |
| `INVALID_AUTHOR` | 400 | Author is empty |
| `INVALID_GENRE` | 400 | Genre validation failed |
| `INVALID_CONDITION` | 400 | Invalid condition value |
| `INVALID_DATA_FORMAT` | 400 | Data type mismatch |
| `FILE_TOO_LARGE` | 400 | File exceeds 5MB |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `ISBN_REQUIRED` | 400 | ISBN is required |
| `QUERY_REQUIRED` | 400 | Search query required |
| `REQUEST_TIMEOUT` | 408 | External API timeout |
| `RATE_LIMIT_EXCEEDED` | 503 | External API rate limited |
| `INTERNAL_ERROR` | 500 | Server error |

### Trades Endpoints (`/api/trades`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `TRADE_NOT_FOUND` | 404 | Trade doesn't exist |
| `REQUESTED_BOOK_NOT_FOUND` | 404 | Requested book doesn't exist |
| `OFFERED_BOOK_NOT_FOUND` | 404 | Offered book doesn't exist |
| `NOT_BOOK_OWNER` | 403 | Can't offer others' books |
| `CANNOT_REQUEST_OWN_BOOK` | 400 | Can't trade with yourself |
| `REQUESTED_BOOK_UNAVAILABLE` | 400 | Requested book not available |
| `OFFERED_BOOK_UNAVAILABLE` | 400 | Offered book not available |
| `NOT_AUTHORIZED` | 403 | Not authorized for this action |
| `INVALID_TRADE_STATUS` | 400 | Trade status doesn't allow action |
| `INTERNAL_ERROR` | 500 | Server error |

### Messages Endpoints (`/api/messages`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `TRADE_NOT_FOUND` | 404 | Trade doesn't exist |
| `MESSAGE_NOT_FOUND` | 404 | Message doesn't exist |
| `NOT_AUTHORIZED` | 403 | Not authorized to access messages |
| `INVALID_TRADE_STATUS` | 400 | Can't message non-accepted trades |
| `CANNOT_MARK_OWN_MESSAGE` | 400 | Can't mark own message as read |
| `INTERNAL_ERROR` | 500 | Server error |

### Ratings Endpoints (`/api/ratings`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `RATING_NOT_FOUND` | 404 | Rating doesn't exist |
| `TRADE_NOT_FOUND` | 404 | Trade doesn't exist |
| `TRADE_NOT_COMPLETED` | 400 | Trade not completed yet |
| `NOT_AUTHORIZED` | 403 | Not part of this trade |
| `DUPLICATE_RATING` | 409 | Already rated this trade |
| `INTERNAL_ERROR` | 500 | Server error |

### Wishlist Endpoints (`/api/wishlist`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `WISHLIST_NOT_FOUND` | 404 | Wishlist item doesn't exist |
| `DUPLICATE_WISHLIST` | 409 | Book already in wishlist |
| `NOT_AUTHORIZED` | 403 | Can't modify others' wishlists |
| `INTERNAL_ERROR` | 500 | Server error |

### Notifications Endpoints (`/api/notifications`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Notification doesn't exist |
| `FORBIDDEN` | 403 | Can't access others' notifications |
| `INTERNAL_ERROR` | 500 | Server error |

### Contact Endpoints (`/api/contact`)

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many submissions |
| `SERVER_ERROR` | 500 | Failed to submit form |

## 🛠️ Error Handling Best Practices

### Frontend Error Handling

```javascript
// Example: Handling API errors in React
async function createBook(bookData) {
  try {
    const response = await axios.post('/api/books', bookData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      const errorCode = data.error?.code;
      const errorMessage = data.error?.message;
      
      // Handle specific error codes
      switch (errorCode) {
        case 'NO_TOKEN':
        case 'INVALID_TOKEN':
          // Redirect to login
          redirectToLogin();
          break;
          
        case 'VALIDATION_ERROR':
          // Show validation errors
          showValidationErrors(data.error.details);
          break;
          
        case 'FILE_TOO_LARGE':
          // Show file size error
          showError('Image must be less than 5MB');
          break;
          
        case 'UNAUTHORIZED_UPDATE':
          // Show permission error
          showError('You can only edit your own books');
          break;
          
        case 'RATE_LIMIT_EXCEEDED':
          // Show rate limit message
          showError('Too many requests. Please wait a moment.');
          break;
          
        default:
          // Generic error message
          showError(errorMessage || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      showError('Network error. Please check your connection.');
    } else {
      // Something else happened
      showError('An unexpected error occurred');
    }
  }
}
```

### Backend Error Handling

```javascript
// Example: Consistent error responses in routes
router.post('/books', authenticateToken, async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0].msg,
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }
    
    // Business logic
    const book = await Book.create(req.body);
    
    res.status(201).json({
      success: true,
      data: book
    });
    
  } catch (error) {
    console.error('Create book error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        }
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while creating book',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});
```

### User-Friendly Error Messages

Map technical error codes to user-friendly messages:

```javascript
const ERROR_MESSAGES = {
  // Authentication
  'NO_TOKEN': 'Please log in to continue',
  'INVALID_TOKEN': 'Your session has expired. Please log in again.',
  'INVALID_CREDENTIALS': 'Email or password is incorrect',
  'EMAIL_EXISTS': 'An account with this email already exists',
  
  // Validation
  'VALIDATION_ERROR': 'Please check your input and try again',
  'MISSING_FIELDS': 'Please fill in all required fields',
  
  // Permissions
  'UNAUTHORIZED_UPDATE': 'You don\'t have permission to edit this',
  'UNAUTHORIZED_DELETE': 'You don\'t have permission to delete this',
  'NOT_AUTHORIZED': 'You don\'t have permission to perform this action',
  
  // Not Found
  'BOOK_NOT_FOUND': 'This book is no longer available',
  'USER_NOT_FOUND': 'User not found',
  'TRADE_NOT_FOUND': 'Trade not found',
  
  // Business Logic
  'DUPLICATE_RATING': 'You\'ve already rated this trade',
  'TRADE_NOT_COMPLETED': 'You can only rate completed trades',
  'INVALID_TRADE_STATUS': 'This action is not available for this trade',
  
  // Rate Limiting
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
  
  // Server Errors
  'INTERNAL_ERROR': 'Something went wrong. Please try again later.',
  'REQUEST_TIMEOUT': 'Request timed out. Please try again.',
};

function getUserFriendlyMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] || 'An error occurred. Please try again.';
}
```

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### "Authentication required" errors
**Problem:** Getting 401 errors on protected endpoints  
**Solutions:**
1. Verify JWT token is included in Authorization header
2. Check token hasn't expired (24-hour expiration)
3. Ensure token format is `Bearer <token>`
4. Re-authenticate if token is invalid

#### "Validation failed" errors
**Problem:** Getting 400 validation errors  
**Solutions:**
1. Check all required fields are provided
2. Verify field formats (email, ISBN, etc.)
3. Ensure field lengths are within limits
4. Check enum values (condition, status, etc.)
5. Review `error.details` for specific field errors

#### "Rate limit exceeded" errors
**Problem:** Getting 429 errors  
**Solutions:**
1. Implement exponential backoff
2. Cache responses when possible
3. Reduce request frequency
4. Wait 15 minutes before retrying

#### "Internal server error" errors
**Problem:** Getting 500 errors  
**Solutions:**
1. Check server logs for details
2. Verify database connection
3. Ensure all environment variables are set
4. Check external API availability
5. Contact support if problem persists

#### File upload errors
**Problem:** Image upload failing  
**Solutions:**
1. Ensure file size is under 5MB
2. Use only JPEG, PNG, or WebP formats
3. Check file is not corrupted
4. Verify Cloudinary configuration

## 📖 Related Documentation

- **[Authentication API](./AUTHENTICATION_API.md)** - Complete authentication endpoints
- **[Books API](./BOOKS_API.md)** - Book management endpoints
- **[Trades API](./TRADES_API.md)** - Trade management endpoints
- **[Messages API](./MESSAGES_API.md)** - Messaging system endpoints
- **[Ratings API](./RATINGS_API.md)** - Rating system endpoints
- **[Wishlist API](./WISHLIST_API.md)** - Wishlist management endpoints
- **[Notifications API](./NOTIFICATIONS_API.md)** - Notification system endpoints

## 📞 Support

If you encounter errors not documented here or need additional help:

1. Check the specific endpoint documentation
2. Review server logs for detailed error information
3. Verify your request format matches the API specification
4. Contact the development team with:
   - Error code and message
   - Request details (endpoint, method, payload)
   - Steps to reproduce
   - Server logs (if available)

## 🔄 Version History

**Version 1.0** - January 2025
- Initial comprehensive error documentation
- All error codes documented
- Examples and troubleshooting guide added
- Best practices for error handling

---

**Last Updated:** January 2025  
**Status:** Production-Ready
