# Utility Functions

## Privacy Utilities (`privacy.js`)

This module provides utility functions for handling user privacy settings throughout the application, particularly when displaying user information in book-related contexts.

### Functions

#### `applyUserPrivacySettings(user, options)`

Applies privacy settings to user data for public display.

**Parameters:**
- `user` (Object): User object from database
- `options` (Object, optional): Configuration options
  - `includeEmail` (boolean): Whether to include email field (default: false)

**Returns:** Object with privacy-filtered user data

**Example:**
```javascript
const { applyUserPrivacySettings } = require('./utils/privacy');

const user = await User.findById(userId);
const publicUserData = applyUserPrivacySettings(user);
// City will be included only if user.privacySettings.showCity !== false
```

#### `applyBookOwnerPrivacy(book)`

Applies privacy settings to book owner information when the owner field is populated.

**Parameters:**
- `book` (Object): Book object with populated owner field

**Returns:** Book object with privacy-filtered owner information

**Example:**
```javascript
const book = await Book.findById(bookId).populate('owner');
const bookWithPrivacy = applyBookOwnerPrivacy(book);
```

#### `applyBookOwnerPrivacyToArray(books)`

Applies privacy settings to multiple books with owner information.

**Parameters:**
- `books` (Array): Array of book objects with populated owner fields

**Returns:** Array of books with privacy-filtered owner information

#### `applyBookOwnerPrivacyMiddleware(req, res, next)`

Express middleware that automatically applies privacy settings to API responses containing book owner information.

**Usage:**
```javascript
const { applyBookOwnerPrivacyMiddleware } = require('./utils/privacy');

// Apply to specific routes
router.get('/books', applyBookOwnerPrivacyMiddleware, (req, res) => {
  // Your route handler
});

// Or apply globally
app.use('/api/books', applyBookOwnerPrivacyMiddleware);
```

### Privacy Rules

1. **City Visibility**: User's city is hidden when `privacySettings.showCity` is `false`
2. **Email Protection**: Email is never included in public responses unless explicitly requested
3. **Default Behavior**: If privacy settings are undefined, city is shown (backward compatibility)
4. **Consistent Application**: Privacy settings are applied consistently across all book-related endpoints

### Integration with Book Routes

All book-related routes that return owner information should use these utility functions:

- `GET /api/books/:id` - Single book with owner info
- `GET /api/books` - List of books with owner info
- `GET /api/books/user/:userId` - User's books with owner info
- Any future book-related endpoints

### Testing

The privacy functionality is thoroughly tested in:
- `__tests__/privacy.test.js` - Unit tests for utility functions
- `__tests__/books.test.js` - Integration tests for book routes with privacy

### Future Considerations

This privacy system is designed to be extensible. Future privacy settings can be easily added:

```javascript
// Example of additional privacy settings
privacySettings: {
  showCity: true,
  showEmail: false,        // Future: email visibility
  showRatings: true,       // Future: rating visibility
  showWishlist: true       // Future: wishlist visibility
}
```