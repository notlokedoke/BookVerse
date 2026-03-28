# Backend Testing Infrastructure

This directory contains the test suite for the BookVerse backend API.

## Setup

### Prerequisites

1. **MongoDB**: Ensure MongoDB is running locally for tests
   ```bash
   # Start MongoDB (if using local installation)
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb-test mongo:latest
   ```

2. **Dependencies**: Install test dependencies
   ```bash
   cd server
   npm install
   ```

### Environment Configuration

Tests use a separate test database to avoid affecting development data.

- **Test environment variables** are configured in `.env.test`
- **Default test database**: `mongodb://127.0.0.1:27017/bookverse-test`
- The `setup.js` file loads these variables before tests run

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- auth.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should register"
```

## Test Structure

### Test Files

All test files follow the naming convention: `*.test.js`

Current test suites:
- `auth.test.js` - Authentication endpoints (register, login, profile)
- `books.test.js` - Book CRUD operations
- `books-upload.test.js` - Book image upload functionality
- `books-validation.test.js` - Book input validation
- `trades.test.js` - Trade proposal and management
- `message.test.js` - Trade messaging system
- `rating.test.js` - Rating submission and calculation
- `wishlist.test.js` - Wishlist operations
- `notifications.test.js` - Notification system
- `users.test.js` - User profile management
- `privacy.test.js` - Privacy settings
- `security.test.js` - Security features
- `rate-limiting.test.js` - Rate limiting
- `cors-security.test.js` - CORS configuration
- `jwt.test.js` - JWT token handling
- `database.test.js` - Database connection

### Test Utilities

The `test-utils.js` file provides helper functions for creating test data:

#### Database Management
```javascript
const { clearDatabase } = require('./test-utils');

// Clear all collections
await clearDatabase();
```

#### User Creation
```javascript
const { createTestUser, createTestUsers, generateAuthToken } = require('./test-utils');

// Create a single user
const user = await createTestUser({
  name: 'John Doe',
  email: 'john@example.com',
  city: 'New York'
});

// Create multiple users
const users = await createTestUsers(3);

// Generate auth token for a user
const token = generateAuthToken(user._id);
```

#### Book Creation
```javascript
const { createTestBook, createTestBooks } = require('./test-utils');

// Create a single book
const book = await createTestBook(userId, {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Fiction'
});

// Create multiple books for a user
const books = await createTestBooks(userId, 5);
```

#### Trade Creation
```javascript
const { createTestTrade } = require('./test-utils');

const trade = await createTestTrade(
  proposerId,
  receiverId,
  requestedBookId,
  offeredBookId,
  { status: 'accepted' }
);
```

#### Complete Scenario Seeding
```javascript
const { seedCompleteScenario } = require('./test-utils');

// Seed a complete test scenario with users, books, and trades
const testData = await seedCompleteScenario();
// Returns: { users, books, trades, wishlists }
```

#### Other Utilities
```javascript
const { 
  createTestMessage,
  createTestRating,
  createTestWishlist,
  createTestNotification,
  wait,
  generateRandomEmail,
  generateRandomISBN
} = require('./test-utils');
```

## Test Patterns

### Basic Test Structure

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { clearDatabase, createTestUser, generateAuthToken } = require('./test-utils');

describe('Feature Name', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectDB();
  });

  afterAll(async () => {
    // Clean up and close connection
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear data before each test
    await clearDatabase();
  });

  test('should do something', async () => {
    // Arrange
    const user = await createTestUser();
    const token = generateAuthToken(user._id);

    // Act
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(response.body.success).toBe(true);
  });
});
```

### Testing Protected Routes

```javascript
test('should access protected route with valid token', async () => {
  const user = await createTestUser();
  const token = generateAuthToken(user._id);

  const response = await request(app)
    .get('/api/protected-endpoint')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(response.body.success).toBe(true);
});

test('should reject access without token', async () => {
  const response = await request(app)
    .get('/api/protected-endpoint')
    .expect(401);

  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('NO_TOKEN');
});
```

### Testing with Multiple Users

```javascript
test('should handle interaction between users', async () => {
  const [user1, user2] = await createTestUsers(2);
  const token1 = generateAuthToken(user1._id);
  
  const book = await createTestBook(user2._id);

  const response = await request(app)
    .post('/api/trades')
    .set('Authorization', `Bearer ${token1}`)
    .send({
      requestedBook: book._id,
      offeredBook: someOtherBookId
    })
    .expect(201);

  expect(response.body.data.proposer).toBe(user1._id.toString());
  expect(response.body.data.receiver).toBe(user2._id.toString());
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests complete
3. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
5. **Test Edge Cases**: Test both success and failure scenarios
6. **Use Test Utilities**: Leverage the test-utils.js helpers to reduce boilerplate
7. **Mock External Services**: Mock external APIs (Google Books, Cloudinary) in tests
8. **Separate Database**: Always use a separate test database

## Debugging Tests

### Run tests with verbose output
```bash
npm test -- --verbose
```

### Run a single test file
```bash
npm test -- auth.test.js
```

### Run tests with debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open Chrome DevTools at `chrome://inspect`

### View test coverage
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Common Issues

### MongoDB Connection Issues

If tests fail with connection errors:
1. Ensure MongoDB is running: `mongod` or check Docker container
2. Verify connection string in `.env.test`
3. Check if port 27017 is available

### Port Already in Use

If you get "port already in use" errors:
1. The test server uses port 5001 (different from dev port 5000)
2. Kill any processes using port 5001: `lsof -ti:5001 | xargs kill -9`

### Test Timeout Issues

If tests timeout:
1. Increase timeout in `jest.config.js` (currently 30000ms)
2. Check for hanging database connections
3. Ensure all async operations are properly awaited

## Adding New Tests

When adding new test files:

1. Create file with `.test.js` extension in `__tests__/` directory
2. Import required dependencies and test utilities
3. Follow the test structure pattern shown above
4. Add appropriate setup and teardown hooks
5. Write descriptive test cases covering success and error scenarios
6. Run tests to ensure they pass: `npm test -- your-new-test.test.js`

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    cd server
    npm test
  env:
    MONGODB_URI: mongodb://localhost:27017/bookverse-test
    JWT_SECRET: test_secret
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server) (alternative to local MongoDB)
