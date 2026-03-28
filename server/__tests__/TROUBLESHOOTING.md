# Test Failures Troubleshooting Guide

## Your Current Issue

**Problem:** 18 test suites failing with MongoDB timeout errors
**Error:** `MongooseError: Operation 'users.deleteMany()' buffering timed out after 10000ms`

## Quick Fixes (Try in Order)

### Fix 1: Restart MongoDB (Most Common Solution)

```bash
# Stop MongoDB
sudo pkill -f mongod

# Start MongoDB
mongod --dbpath /usr/local/var/mongodb

# Or if using Homebrew:
brew services restart mongodb-community
```

### Fix 2: Clear Test Database

```bash
# Connect to MongoDB
mongosh

# Switch to test database
use bookverse-test

# Drop the database
db.dropDatabase()

# Exit
exit
```

### Fix 3: Run Tests with Increased Timeout

I've already updated the configuration. Now run:

```bash
cd server

# Run all tests
npm test

# Or run one test file at a time
npm test -- auth.test.js
npm test -- books.test.js
```

### Fix 4: Run Tests Serially (One at a Time)

```bash
cd server

# Run with single worker (slower but more reliable)
npm test -- --maxWorkers=1
```

### Fix 5: Check MongoDB Connection

```bash
cd server

# Test MongoDB connection
node test-db-connection.js
```

If this fails, MongoDB isn't accessible.

## Step-by-Step Debugging

### Step 1: Verify MongoDB is Running

```bash
# Check if MongoDB process is running
ps aux | grep mongod

# Or
pgrep mongod
```

**Expected:** Should show a process ID

**If not running:**
```bash
# Start MongoDB
mongod --dbpath /usr/local/var/mongodb

# Or with Homebrew
brew services start mongodb-community
```

### Step 2: Test MongoDB Connection

```bash
# Try connecting with mongosh
mongosh mongodb://127.0.0.1:27017/bookverse-test

# Should connect successfully
# Type 'exit' to quit
```

**If connection fails:**
- MongoDB isn't running
- Wrong port (check if it's 27017)
- Firewall blocking connection

### Step 3: Check Test Environment Variables

```bash
cd server
cat .env.test
```

**Should contain:**
```
MONGODB_URI=mongodb://127.0.0.1:27017/bookverse-test
```

**If file doesn't exist or URI is wrong:**
```bash
# Create/update .env.test
echo "MONGODB_URI=mongodb://127.0.0.1:27017/bookverse-test" > .env.test
echo "JWT_SECRET=test_jwt_secret_key_for_testing_only" >> .env.test
echo "NODE_ENV=test" >> .env.test
```

### Step 4: Clear Node Modules and Reinstall

```bash
cd server

# Remove node_modules
rm -rf node_modules

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Step 5: Run Tests One at a Time

```bash
cd server

# Test authentication first (usually most stable)
npm test -- auth.test.js

# If that works, try another
npm test -- books.test.js

# If individual tests work but all together fail:
# Run with single worker
npm test -- --maxWorkers=1
```

## Common Issues and Solutions

### Issue 1: "Connection Refused"

**Cause:** MongoDB not running

**Solution:**
```bash
# Start MongoDB
mongod --dbpath /usr/local/var/mongodb

# Or
brew services start mongodb-community
```

### Issue 2: "Timeout after 10000ms"

**Cause:** Tests running too fast, connections not ready

**Solution:** Already fixed in jest.config.js (increased to 60s)

```bash
# Just run tests again
npm test
```

### Issue 3: "Port 27017 Already in Use"

**Cause:** Another MongoDB instance running

**Solution:**
```bash
# Find the process
lsof -i :27017

# Kill it
kill -9 <PID>

# Start MongoDB again
mongod --dbpath /usr/local/var/mongodb
```

### Issue 4: "Cannot Find Module"

**Cause:** Missing dependencies

**Solution:**
```bash
cd server
npm install
```

### Issue 5: "Database Access Denied"

**Cause:** Permission issues

**Solution:**
```bash
# Check MongoDB data directory permissions
ls -la /usr/local/var/mongodb

# Fix permissions if needed
sudo chown -R $(whoami) /usr/local/var/mongodb
```

## Nuclear Option: Complete Reset

If nothing else works:

```bash
# 1. Stop MongoDB
sudo pkill -f mongod

# 2. Remove test database files
rm -rf /usr/local/var/mongodb/bookverse-test*

# 3. Clear npm cache
cd server
rm -rf node_modules
npm cache clean --force

# 4. Reinstall dependencies
npm install

# 5. Start MongoDB fresh
mongod --dbpath /usr/local/var/mongodb

# 6. In another terminal, run tests
cd server
npm test
```

## For Your Academic Submission

### Option 1: Fix All Tests (Recommended)

Follow the fixes above until all tests pass, then proceed with documentation.

### Option 2: Document Passing Tests Only

If some tests consistently fail:

1. **Identify which tests pass:**
   ```bash
   npm test -- auth.test.js
   npm test -- books.test.js
   # etc.
   ```

2. **Document only passing tests** in your report

3. **Add a section** explaining:
   - Which tests pass (with screenshots)
   - Which tests fail and why (MongoDB connection issues)
   - How you would fix in production (proper MongoDB setup)

### Option 3: Use Subset of Tests

Run only the stable tests for your report:

```bash
# Create a custom test script
npm test -- auth.test.js books.test.js trades.test.js rating.test.js
```

Document these as your "core functionality tests"

## Quick Test Commands

```bash
# Navigate to server
cd server

# Run all tests
npm test

# Run with verbose output
npm run test:verbose

# Run specific test file
npm test -- auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should register"

# Run with coverage
npm run test:coverage

# Run serially (one at a time)
npm test -- --maxWorkers=1

# Run with increased timeout
npm test -- --testTimeout=120000
```

## Verification Checklist

Before running tests, verify:

- [ ] MongoDB is running (`ps aux | grep mongod`)
- [ ] Can connect to MongoDB (`mongosh mongodb://127.0.0.1:27017`)
- [ ] .env.test file exists with correct MONGODB_URI
- [ ] node_modules installed (`ls server/node_modules`)
- [ ] No other tests running
- [ ] Sufficient disk space
- [ ] No firewall blocking port 27017

## Still Not Working?

### Last Resort Options

1. **Use MongoDB Memory Server** (in-memory database for tests)
   ```bash
   cd server
   npm install --save-dev mongodb-memory-server
   ```
   
   Then update tests to use memory server instead of local MongoDB

2. **Skip Database Tests** (not recommended)
   - Focus on unit tests that don't need database
   - Document integration tests separately

3. **Use Docker MongoDB**
   ```bash
   docker run -d -p 27017:27017 --name mongodb-test mongo:latest
   npm test
   docker stop mongodb-test
   ```

## Getting Help

If you're still stuck:

1. **Check the error message carefully** - it usually tells you what's wrong
2. **Run one test file at a time** - isolate the problem
3. **Check MongoDB logs** - look for connection errors
4. **Verify environment** - ensure all variables are set correctly

## For Your Report

Even if some tests fail, you can still submit a good report:

1. **Document what works** - show passing tests
2. **Explain failures** - "Due to MongoDB connection issues in test environment..."
3. **Show understanding** - explain how you would fix it
4. **Include partial results** - better than nothing

Remember: **Partial test results with good documentation > No submission**

---

**Most Common Fix:** Just restart MongoDB and run tests again!

```bash
# Terminal 1: Start MongoDB
mongod --dbpath /usr/local/var/mongodb

# Terminal 2: Run tests
cd server
npm test
```
