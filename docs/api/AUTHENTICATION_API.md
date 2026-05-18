# Authentication API Documentation

## 📚 Overview

The BookVerse Authentication API provides secure user registration, login, profile management, and password recovery functionality. The API uses JWT (JSON Web Tokens) for stateless authentication and bcrypt for secure password hashing.

### Base URL

```
http://localhost:5000/api/auth
```

### Authentication Method

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Token Expiration**: 24 hours
- **Token Location**: Returned in login/register responses

### Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **Input Validation**: express-validator for all inputs
- ✅ **Input Sanitization**: DOMPurify and custom sanitizers
- ✅ **Rate Limiting**: 100 requests/minute for auth endpoints
- ✅ **Token Blacklisting**: Secure logout implementation
- ✅ **Email Verification**: Token-based email confirmation
- ✅ **Password Reset**: Secure token-based password recovery

---

## 📋 Table of Contents

1. [User Registration](#1-user-registration)
2. [User Login](#2-user-login)
3. [Get Current User](#3-get-current-user)
4. [Update Profile](#4-update-profile)
5. [Logout](#5-logout)
6. [Email Verification](#6-email-verification)
7. [Resend Verification Email](#7-resend-verification-email)
8. [Forgot Password](#8-forgot-password)
9. [Reset Password](#9-reset-password)
10. [Change Password](#10-change-password)
11. [Delete Account](#11-delete-account)
12. [Google OAuth](#12-google-oauth)
13. [Error Codes](#error-codes)
14. [Data Models](#data-models)

---

## 1. User Registration

Register a new user account with email and password.

### Endpoint

```
POST /api/auth/register
```

### Access

Public (no authentication required)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "city": "New York"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `name` | string | Yes | User's full name | 1-100 characters |
| `email` | string | Yes | User's email address | Valid email format |
| `password` | string | Yes | User's password | Minimum 8 characters |
| `city` | string | Yes | User's city | 1-100 characters |

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "city": "New York",
    "bio": "",
    "emailVerified": false,
    "privacySettings": {
      "showCity": true,
      "showEmail": false
    },
    "averageRating": 0,
    "ratingCount": 0,
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
    "message": "Please provide all required fields: name, email, password, and city",
    "code": "MISSING_FIELDS",
    "details": [
      {
        "msg": "Email is required",
        "param": "email",
        "location": "body"
      }
    ]
  }
}
```

#### Invalid Email Format

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Please provide a valid email address",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Please provide a valid email address",
        "param": "email",
        "location": "body"
      }
    ]
  }
}
```

#### Password Too Short

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 8 characters long",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Password must be at least 8 characters long",
        "param": "password",
        "location": "body"
      }
    ]
  }
}
```

#### Email Already Exists

**Status Code**: `409 Conflict`

```json
{
  "success": false,
  "error": {
    "message": "An account with this email already exists",
    "code": "EMAIL_EXISTS"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "city": "New York"
  }'
```

### Notes

- Password is automatically hashed using bcrypt before storage
- Email is converted to lowercase for consistency
- A verification email is sent to the provided email address
- User must verify email before full account access (optional enforcement)
- Default privacy settings: city visible, email hidden

---

## 2. User Login

Authenticate a user and receive a JWT token.

### Endpoint

```
POST /api/auth/login
```

### Access

Public (no authentication required)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "city": "New York",
      "bio": "Book enthusiast and avid reader",
      "privacySettings": {
        "showCity": true,
        "showEmail": false
      },
      "averageRating": 4.5,
      "ratingCount": 12,
      "emailVerified": true,
      "isOAuthUser": false,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

### Error Responses

#### Invalid Credentials

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

#### Missing Fields

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Email is required",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Email is required",
        "param": "email",
        "location": "body"
      }
    ]
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### Notes

- Store the returned JWT token securely (e.g., localStorage, sessionStorage, or httpOnly cookie)
- Include the token in the `Authorization` header for protected routes
- Token expires after 24 hours
- Email is case-insensitive (automatically converted to lowercase)

---

## 3. Get Current User

Retrieve the authenticated user's profile information.

### Endpoint

```
GET /api/auth/me
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
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "city": "New York",
    "bio": "Book enthusiast and avid reader",
    "emailVerified": true,
    "privacySettings": {
      "showCity": true,
      "showEmail": false
    },
    "averageRating": 4.5,
    "ratingCount": 12,
    "passwordChangedAt": "2025-01-10T08:20:00.000Z",
    "isOAuthUser": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Missing Token

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Access denied. No token provided.",
    "code": "NO_TOKEN"
  }
}
```

#### Invalid Token

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Invalid token",
    "code": "INVALID_TOKEN"
  }
}
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- This endpoint is useful for checking if a token is still valid
- Use this to fetch updated user information after profile changes
- Password field is never included in the response

---

## 4. Update Profile

Update the authenticated user's profile information and privacy settings.

### Endpoint

```
PUT /api/auth/profile
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
  "name": "John Smith",
  "city": "Los Angeles",
  "bio": "Passionate reader and book collector",
  "privacySettings": {
    "showCity": false,
    "showEmail": true
  }
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `name` | string | No | User's full name | 1-100 characters |
| `city` | string | No | User's city | 1-100 characters |
| `bio` | string | No | User's biography | Max 500 characters |
| `privacySettings.showCity` | boolean | No | Show city to other users | true or false |
| `privacySettings.showEmail` | boolean | No | Show email to other users | true or false |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john.doe@example.com",
    "city": "Los Angeles",
    "bio": "Passionate reader and book collector",
    "privacySettings": {
      "showCity": false,
      "showEmail": true
    },
    "averageRating": 4.5,
    "ratingCount": 12,
    "emailVerified": true,
    "isOAuthUser": false,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-16T14:20:00.000Z"
  }
}
```

### Error Responses

#### No Update Fields Provided

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Please provide at least one field to update (name, city, bio, or privacySettings)",
    "code": "NO_UPDATE_FIELDS"
  }
}
```

#### Validation Error

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Bio cannot exceed 500 characters",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Bio cannot exceed 500 characters",
        "param": "bio",
        "location": "body"
      }
    ]
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "city": "Los Angeles",
    "privacySettings": {
      "showCity": false
    }
  }'
```

### Notes

- All fields are optional - only provide fields you want to update
- Privacy settings can be updated individually
- Email cannot be changed through this endpoint (security measure)
- Changes are immediately reflected in the database

---

## 5. Logout

Logout the authenticated user and invalidate their JWT token.

### Endpoint

```
POST /api/auth/logout
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
  "message": "Logout successful. Token has been invalidated."
}
```

### Error Responses

#### Missing Token

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Access denied. No token provided.",
    "code": "NO_TOKEN"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Notes

- The token is added to a blacklist and cannot be reused
- Client should delete the stored token after logout
- Blacklisted tokens are automatically cleaned up after expiration

---

## 6. Email Verification

Verify a user's email address using the verification token sent via email.

### Endpoint

```
POST /api/auth/verify-email
```

### Access

Public (no authentication required)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Email verification token from email |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

### Error Responses

#### Invalid or Expired Token

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired verification token",
    "code": "INVALID_TOKEN"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
  }'
```

### Notes

- Verification tokens expire after 24 hours
- Once verified, the `emailVerified` field is set to `true`
- Verification token is cleared after successful verification

---

## 7. Resend Verification Email

Request a new verification email if the original expired or was not received.

### Endpoint

```
POST /api/auth/resend-verification
```

### Access

Public (no authentication required)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "john.doe@example.com"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

### Error Responses

#### Already Verified

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Email is already verified",
    "code": "ALREADY_VERIFIED"
  }
}
```

#### Invalid Email

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Please provide a valid email address",
    "code": "VALIDATION_ERROR"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### Notes

- For security, the response doesn't reveal if the email exists in the system
- A new verification token is generated and the old one is invalidated
- New token also expires after 24 hours

---

## 8. Forgot Password

Request a password reset email.

### Endpoint

```
POST /api/auth/forgot-password
```

### Access

Public (no authentication required)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "john.doe@example.com"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

### Error Responses

#### OAuth Account

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "This account uses Google sign-in. Please log in with Google.",
    "code": "OAUTH_ACCOUNT"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### Notes

- For security, the response doesn't reveal if the email exists
- Reset tokens expire after 1 hour
- Cannot reset password for Google OAuth accounts without passwords

---

## 9. Reset Password

Reset a user's password using the reset token from email.

### Endpoint

```
POST /api/auth/reset-password
```

### Access

Public (no authentication required)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "password": "NewSecurePass456"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `token` | string | Yes | Password reset token from email | - |
| `password` | string | Yes | New password | Minimum 8 characters |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

### Error Responses

#### Invalid or Expired Token

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired reset token",
    "code": "INVALID_TOKEN"
  }
}
```

#### Password Too Short

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 8 characters long",
    "code": "VALIDATION_ERROR"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "password": "NewSecurePass456"
  }'
```

### Notes

- Reset tokens expire after 1 hour
- Password is automatically hashed before storage
- Reset token is cleared after successful password reset
- User must log in again with the new password

---

## 10. Change Password

Change the password for an authenticated user.

### Endpoint

```
PUT /api/auth/change-password
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
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `currentPassword` | string | Yes | Current password | - |
| `newPassword` | string | Yes | New password | Minimum 8 characters |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error Responses

#### Incorrect Current Password

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Current password is incorrect",
    "code": "INVALID_PASSWORD"
  }
}
```

#### Same Password

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "New password must be different from current password",
    "code": "SAME_PASSWORD"
  }
}
```

#### OAuth Account

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "This account uses Google sign-in and does not have a password.",
    "code": "OAUTH_ACCOUNT"
  }
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

### Notes

- User must be authenticated to change password
- Current password must be verified before allowing change
- New password cannot be the same as current password
- OAuth users without passwords cannot use this endpoint

---

## 11. Delete Account

Permanently delete a user account and all associated data.

### Endpoint

```
DELETE /api/auth/account
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
  "password": "SecurePass123",
  "confirmText": "DELETE"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `password` | string | Conditional | User's password (required for non-OAuth users) | - |
| `confirmText` | string | Yes | Confirmation text | Must be "DELETE" |

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Account deleted successfully. All your data has been removed."
}
```

### Error Responses

#### Incorrect Password

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Incorrect password",
    "code": "INVALID_PASSWORD"
  }
}
```

#### Invalid Confirmation

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Confirmation text must be \"DELETE\"",
    "code": "VALIDATION_ERROR"
  }
}
```

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/auth/account \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecurePass123",
    "confirmText": "DELETE"
  }'
```

### Notes

- **This action is irreversible**
- Deletes all associated data:
  - User profile
  - Book listings
  - Trade proposals
  - Messages
  - Wishlist items
  - Ratings (given and received)
  - Notifications
- Current JWT token is blacklisted
- OAuth users don't need to provide password

---

## 12. Google OAuth

Authenticate using Google OAuth 2.0.

### Initiate OAuth Flow

#### Endpoint

```
GET /api/auth/google
```

#### Access

Public (no authentication required)

#### Description

Redirects the user to Google's OAuth consent screen.

#### Example

```html
<a href="http://localhost:5000/api/auth/google">
  Sign in with Google
</a>
```

### OAuth Callback

#### Endpoint

```
GET /api/auth/google/callback
```

#### Access

Public (handled by Google OAuth)

#### Description

Google redirects to this endpoint after user authorization. The server then:

1. Verifies the Google OAuth response
2. Creates or updates the user account
3. Generates a JWT token
4. Redirects to the frontend with the token

#### Success Redirect

```
http://localhost:3000/auth/callback?token=<jwt_token>
```

or (if profile incomplete):

```
http://localhost:3000/complete-profile?token=<jwt_token>
```

#### Error Redirect

```
http://localhost:3000/login?error=auth_failed
```

### Notes

- OAuth users are identified by `googleId` field
- OAuth users may not have a password (password field is optional)
- If user doesn't have a city, they're redirected to complete their profile
- OAuth users have `isOAuthUser: true` in their profile
- Email from Google is automatically verified

---

## Error Codes

### Authentication Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NO_TOKEN` | 401 | No JWT token provided in request |
| `INVALID_TOKEN` | 401 | JWT token is invalid or expired |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `INVALID_PASSWORD` | 401 | Current password is incorrect |

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `MISSING_FIELDS` | 400 | Required fields are missing |
| `NO_UPDATE_FIELDS` | 400 | No fields provided for update |
| `SAME_PASSWORD` | 400 | New password same as current |

### Conflict Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EMAIL_EXISTS` | 409 | Email already registered |
| `ALREADY_VERIFIED` | 400 | Email already verified |

### Account Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | User account not found |
| `OAUTH_ACCOUNT` | 400 | Action not allowed for OAuth accounts |
| `PASSWORD_REQUIRED` | 400 | Password required for this action |

### Server Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Data Models

### User Object

```typescript
{
  _id: string;                    // MongoDB ObjectId
  name: string;                   // User's full name
  email: string;                  // User's email (lowercase)
  city: string;                   // User's city
  bio: string;                    // User biography (max 500 chars)
  emailVerified: boolean;         // Email verification status
  privacySettings: {
    showCity: boolean;            // Show city to other users
    showEmail: boolean;           // Show email to other users
  };
  averageRating: number;          // Average rating (0-5)
  ratingCount: number;            // Total number of ratings
  passwordChangedAt?: Date;       // Last password change timestamp
  isOAuthUser: boolean;           // True if registered via OAuth
  createdAt: Date;                // Account creation timestamp
  updatedAt?: Date;               // Last update timestamp
}
```

### JWT Token Payload

```typescript
{
  userId: string;                 // User's MongoDB ObjectId
  iat: number;                    // Issued at (Unix timestamp)
  exp: number;                    // Expiration (Unix timestamp)
}
```

### Privacy Settings

```typescript
{
  showCity: boolean;              // Default: true
  showEmail: boolean;             // Default: false
}
```

---

## Authentication Flow

### Registration Flow

```
1. User submits registration form
   ↓
2. Server validates input
   ↓
3. Server checks if email exists
   ↓
4. Server hashes password with bcrypt
   ↓
5. Server creates user in database
   ↓
6. Server generates verification token
   ↓
7. Server sends verification email
   ↓
8. Server returns user data (without password)
```

### Login Flow

```
1. User submits login credentials
   ↓
2. Server validates input
   ↓
3. Server finds user by email
   ↓
4. Server compares password hash
   ↓
5. Server generates JWT token
   ↓
6. Server returns token and user data
   ↓
7. Client stores token
   ↓
8. Client includes token in subsequent requests
```

### Protected Route Flow

```
1. Client sends request with JWT token
   ↓
2. Server extracts token from Authorization header
   ↓
3. Server checks if token is blacklisted
   ↓
4. Server verifies token signature
   ↓
5. Server decodes token payload
   ↓
6. Server fetches user from database
   ↓
7. Server attaches user to request object
   ↓
8. Server processes the request
```

---

## Best Practices

### Client-Side

1. **Store tokens securely**
   - Use httpOnly cookies for maximum security
   - Or use localStorage/sessionStorage with XSS protection

2. **Include token in requests**
   ```javascript
   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   ```

3. **Handle token expiration**
   - Implement automatic logout on 401 errors
   - Optionally implement token refresh

4. **Clear token on logout**
   ```javascript
   localStorage.removeItem('token');
   delete axios.defaults.headers.common['Authorization'];
   ```

### Server-Side

1. **Never expose passwords**
   - Always exclude password field from responses
   - Use `.select('-password')` in queries

2. **Validate all inputs**
   - Use express-validator for validation
   - Sanitize inputs to prevent XSS

3. **Rate limit auth endpoints**
   - Prevent brute force attacks
   - Use express-rate-limit

4. **Log security events**
   - Failed login attempts
   - Password changes
   - Account deletions

---

## Testing

### Manual Testing with cURL

#### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "city": "Test City"
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

#### Get Current User

```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### Update Profile

```bash
TOKEN="your_jwt_token_here"
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "bio": "Updated bio"
  }'
```

### Automated Testing

```bash
# Run authentication tests
cd server
npm test -- auth.test.js
```

---

## Rate Limiting

### Authentication Endpoints

- **Rate**: 100 requests per minute per IP
- **Applies to**: `/api/auth/*`
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

### General API Endpoints

- **Rate**: 1000 requests per 15 minutes per IP
- **Applies to**: All other endpoints

---

## Security Considerations

### Password Security

- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ Minimum 8 characters required
- ✅ Never stored or transmitted in plain text
- ✅ Password change requires current password verification

### Token Security

- ✅ JWT tokens signed with secret key
- ✅ Tokens expire after 24 hours
- ✅ Blacklist implemented for logout
- ✅ Tokens validated on every protected request

### Input Security

- ✅ All inputs validated with express-validator
- ✅ Inputs sanitized to prevent XSS
- ✅ Email normalized to lowercase
- ✅ MongoDB injection prevention

### Privacy

- ✅ User-controlled privacy settings
- ✅ Email hidden by default
- ✅ Password never exposed in responses
- ✅ Sensitive fields excluded from queries

---

## Support

For issues or questions about the Authentication API:

1. Check this documentation
2. Review error codes and messages
3. Check server logs for detailed error information
4. Contact the development team

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
