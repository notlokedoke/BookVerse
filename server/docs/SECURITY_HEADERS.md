# Security Headers Configuration

This document explains the security headers implemented in the BookVerse platform to protect against common web vulnerabilities.

## Overview

BookVerse implements comprehensive security headers using Helmet.js and custom middleware to ensure secure communication and protect user data.

## Implemented Security Headers

### 1. Content Security Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded.

**Configuration**:
```javascript
{
  defaultSrc: ["'self'"],                    // Only load resources from same origin
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:", "http:"],
  scriptSrc: ["'self'"],                     // Only execute scripts from same origin
  connectSrc: ["'self'", "https://api.cloudinary.com", "https://www.googleapis.com"],
  frameSrc: ["'none'"],                      // Prevent embedding in iframes
  objectSrc: ["'none'"],                     // Prevent Flash and other plugins
  upgradeInsecureRequests: []                // Upgrade HTTP to HTTPS in production
}
```

**Protection**: Mitigates XSS, clickjacking, and code injection attacks.

### 2. HTTP Strict Transport Security (HSTS)

**Purpose**: Forces browsers to use HTTPS connections only.

**Configuration**:
```javascript
{
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true, // Apply to all subdomains
  preload: true            // Eligible for browser preload lists
}
```

**Protection**: Prevents man-in-the-middle attacks and protocol downgrade attacks.

### 3. X-Content-Type-Options

**Header**: `X-Content-Type-Options: nosniff`

**Purpose**: Prevents browsers from MIME-sniffing responses.

**Protection**: Stops browsers from interpreting files as a different MIME type than declared.

### 4. X-Frame-Options

**Header**: Set by Helmet (default: `SAMEORIGIN`)

**Purpose**: Controls whether the site can be embedded in iframes.

**Protection**: Prevents clickjacking attacks.

### 5. Referrer-Policy

**Header**: `Referrer-Policy: strict-origin-when-cross-origin`

**Purpose**: Controls how much referrer information is sent with requests.

**Protection**: Prevents leaking sensitive information in URLs to third parties.

## HTTPS Enforcement

### Production Environment

In production, the application automatically redirects all HTTP requests to HTTPS:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Development Environment

HTTPS enforcement is disabled in development to simplify local testing.

## Secure Cookie Configuration

### Cookie Options Utility

The `getSecureCookieOptions()` function in `utils/jwt.js` provides environment-aware cookie settings:

```javascript
{
  httpOnly: true,              // Prevents JavaScript access
  secure: true,                // HTTPS only (production)
  sameSite: 'strict',          // CSRF protection (production)
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',                   // Available for all routes
  domain: '.yourdomain.com'    // Optional, set via COOKIE_DOMAIN env var
}
```

### Environment-Specific Behavior

**Production**:
- `secure: true` - Cookies only sent over HTTPS
- `sameSite: 'strict'` - Maximum CSRF protection
- `domain` - Set if COOKIE_DOMAIN environment variable is defined

**Development**:
- `secure: false` - Allows HTTP for local development
- `sameSite: 'lax'` - Balanced security and usability

## CORS Configuration

### Allowed Origins

Only the frontend URL (specified in `FRONTEND_URL` environment variable) is whitelisted:

```javascript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}
```

### Protection

- Prevents unauthorized cross-origin requests
- Restricts HTTP methods to only those needed
- Limits exposed headers to minimize information leakage

## Rate Limiting

### Authentication Endpoints

Stricter limits on authentication routes to prevent brute force attacks:

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many authentication attempts'
}
```

### General API Endpoints

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
}
```

## Environment Variables

### Required for Production

```bash
# Security Configuration
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=<strong_random_secret>

# Optional: Cookie domain for multi-subdomain setup
COOKIE_DOMAIN=.yourdomain.com
```

## Testing

Security headers are tested in `__tests__/security-headers.test.js`:

```bash
npm test -- security-headers.test.js
```

### Test Coverage

- ✅ Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Content Security Policy directives
- ✅ HTTPS enforcement in production
- ✅ CORS configuration
- ✅ Secure cookie options
- ✅ Server information hiding

## Best Practices

### 1. Keep Dependencies Updated

Regularly update Helmet and other security packages:

```bash
npm update helmet express-rate-limit
```

### 2. Monitor Security Headers

Use online tools to verify headers:
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

### 3. Review CSP Violations

In production, consider adding CSP reporting:

```javascript
contentSecurityPolicy: {
  directives: {
    // ... other directives
    reportUri: '/api/csp-report'
  }
}
```

### 4. Regular Security Audits

Run security audits regularly:

```bash
npm audit
npm audit fix
```

## Compliance

These security headers help meet requirements for:

- **OWASP Top 10**: Protection against common vulnerabilities
- **PCI DSS**: Secure transmission of payment data (if applicable)
- **GDPR**: Data protection and privacy requirements
- **SOC 2**: Security controls for service organizations

## Additional Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)

## Troubleshooting

### CSP Violations

If legitimate resources are blocked:

1. Check browser console for CSP violation reports
2. Update CSP directives in `server.js`
3. Test thoroughly before deploying

### Cookie Issues

If cookies aren't being set:

1. Verify `secure` flag matches protocol (HTTPS in production)
2. Check `sameSite` setting compatibility with your setup
3. Ensure `domain` is correctly configured for multi-subdomain setups

### HTTPS Redirect Loop

If experiencing redirect loops:

1. Verify reverse proxy is setting `x-forwarded-proto` header
2. Check that `NODE_ENV` is set to `production`
3. Ensure SSL termination is configured correctly
