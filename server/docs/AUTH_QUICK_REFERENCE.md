# Authentication API - Quick Reference

## 🚀 Quick Start

### Base URL
```
http://localhost:5000/api/auth
```

### Common Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 📋 Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login user |
| GET | `/me` | Yes | Get current user |
| PUT | `/profile` | Yes | Update profile |
| POST | `/logout` | Yes | Logout user |
| POST | `/verify-email` | No | Verify email |
| POST | `/resend-verification` | No | Resend verification |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password |
| PUT | `/change-password` | Yes | Change password |
| DELETE | `/account` | Yes | Delete account |
| GET | `/google` | No | Google OAuth |
| GET | `/google/callback` | No | OAuth callback |

---

## 💻 Code Examples

### JavaScript/Axios

#### Register
```javascript
const response = await axios.post('/api/auth/register', {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  city: 'New York'
});

console.log(response.data.data); // User object
```

#### Login
```javascript
const response = await axios.post('/api/auth/login', {
  email: 'john@example.com',
  password: 'SecurePass123'
});

const { token, user } = response.data.data;

// Store token
localStorage.setItem('token', token);

// Set default header for future requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

#### Get Current User
```javascript
const response = await axios.get('/api/auth/me', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

console.log(response.data.data); // User object
```

#### Update Profile
```javascript
const response = await axios.put('/api/auth/profile', {
  name: 'John Smith',
  bio: 'Book lover',
  privacySettings: {
    showCity: false
  }
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

console.log(response.data.data); // Updated user
```

#### Logout
```javascript
await axios.post('/api/auth/logout', {}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// Clear token
localStorage.removeItem('token');
delete axios.defaults.headers.common['Authorization'];
```

#### Change Password
```javascript
await axios.put('/api/auth/change-password', {
  currentPassword: 'OldPass123',
  newPassword: 'NewPass456'
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### React Example

#### Auth Context Setup
```javascript
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', {
      email,
      password
    });
    
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return user;
  };

  const register = async (name, email, password, city) => {
    const response = await axios.post('/api/auth/register', {
      name,
      email,
      password,
      city
    });
    
    return response.data.data;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const updateProfile = async (updates) => {
    const response = await axios.put('/api/auth/profile', updates);
    setUser(response.data.data);
    return response.data.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Using Auth Context
```javascript
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

function LoginForm() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error.response?.data?.error?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### cURL Examples

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "city": "New York"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Update Profile
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "bio": "Book enthusiast"
  }'
```

---

## 🔑 Authentication Requirements

### JWT Token Format

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Structure:**
```javascript
{
  userId: "507f1f77bcf86cd799439011",
  iat: 1642345678,  // Issued at
  exp: 1642432078   // Expires at (24 hours)
}
```

### Password Requirements

- Minimum 8 characters
- No maximum length
- No special character requirements (but recommended)

### Email Requirements

- Valid email format
- Automatically converted to lowercase
- Must be unique in the system

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { /* optional additional info */ }
  }
}
```

---

## ⚠️ Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

**Solutions:**
- Check email and password are correct
- Ensure email is registered
- Verify password meets requirements

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 8 characters long",
    "code": "VALIDATION_ERROR"
  }
}
```

**Solutions:**
- Check all required fields are provided
- Verify field formats (email, password length)
- Review validation error details

### 409 Conflict
```json
{
  "success": false,
  "error": {
    "message": "An account with this email already exists",
    "code": "EMAIL_EXISTS"
  }
}
```

**Solutions:**
- Use a different email address
- Try logging in instead of registering
- Use password reset if you forgot your password

---

## 🛡️ Security Best Practices

### Client-Side

1. **Store tokens securely**
   ```javascript
   // Good: Use httpOnly cookies (server-side)
   // Acceptable: localStorage with XSS protection
   localStorage.setItem('token', token);
   ```

2. **Clear tokens on logout**
   ```javascript
   localStorage.removeItem('token');
   delete axios.defaults.headers.common['Authorization'];
   ```

3. **Handle token expiration**
   ```javascript
   axios.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         // Token expired or invalid
         logout();
         redirectToLogin();
       }
       return Promise.reject(error);
     }
   );
   ```

4. **Never log sensitive data**
   ```javascript
   // Bad
   console.log('Password:', password);
   
   // Good
   console.log('Login attempt for:', email);
   ```

### Server-Side

1. **Always validate inputs**
2. **Never expose passwords in responses**
3. **Use HTTPS in production**
4. **Implement rate limiting**
5. **Log security events**

---

## 🧪 Testing

### Test User Credentials

For development/testing:

```javascript
{
  email: "test@example.com",
  password: "TestPass123"
}
```

### Testing Checklist

- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Get current user with valid token
- [ ] Get current user with invalid token
- [ ] Update profile
- [ ] Change password
- [ ] Logout
- [ ] Verify token is blacklisted after logout

---

## 📱 Google OAuth Integration

### Frontend Button

```html
<a href="http://localhost:5000/api/auth/google">
  <button>Sign in with Google</button>
</a>
```

### Handle OAuth Callback

```javascript
// In your /auth/callback route
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const error = urlParams.get('error');

if (token) {
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  // Fetch user and redirect to dashboard
} else if (error) {
  // Handle error
  console.error('OAuth failed:', error);
}
```

### Complete Profile (OAuth Users)

```javascript
// If redirected to /complete-profile
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Store token
localStorage.setItem('token', token);

// Update profile with city
await axios.put('/api/auth/profile', {
  city: 'New York'
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

## 🔍 Debugging Tips

### Check Token Validity

```javascript
const token = localStorage.getItem('token');
if (token) {
  try {
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Token is valid, user:', response.data.data);
  } catch (error) {
    console.log('Token is invalid or expired');
    localStorage.removeItem('token');
  }
}
```

### Inspect Token Payload

```javascript
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

const token = localStorage.getItem('token');
const payload = parseJwt(token);
console.log('Token expires at:', new Date(payload.exp * 1000));
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "No token provided" | Include Authorization header |
| "Invalid token" | Token expired or malformed, login again |
| "Invalid credentials" | Check email/password, ensure account exists |
| "Email already exists" | Use different email or login instead |
| CORS errors | Check CORS configuration on server |

---

## 📚 Related Documentation

- [Full Authentication API Documentation](./AUTHENTICATION_API.md)
- [User Model Schema](../models/User.js)
- [JWT Utilities](../utils/jwt.js)
- [Auth Middleware](../middleware/auth.js)

---

**Last Updated**: January 2025  
**API Version**: 1.0
