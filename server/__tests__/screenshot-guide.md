# Test Screenshot Guide for Academic Submission

This guide helps you capture professional screenshots of test execution for your academic report.

## Prerequisites

1. **Terminal Setup**
   - Use a clean terminal window
   - Increase font size for readability (14-16pt recommended)
   - Use a light theme for better printing (or dark if preferred)
   - Maximize terminal window for full visibility

2. **Screen Capture Tools**
   - **macOS**: Cmd+Shift+4 (select area) or Cmd+Shift+3 (full screen)
   - **Windows**: Snipping Tool or Win+Shift+S
   - **Linux**: Screenshot tool or Flameshot

## Screenshot Checklist

### 1. Test Suite Overview (Required)

**Command:**
```bash
npm test
```

**What to capture:**
- Full test execution output
- Test suite names
- Number of tests passed/failed
- Total execution time
- "Test Suites: X passed" summary

**Screenshot naming:** `01-all-tests-overview.png`

---

### 2. Authentication Tests (Required)

**Command:**
```bash
npm test -- auth.test.js
```

**What to capture:**
- All authentication test cases
- Registration tests (valid/invalid)
- Login tests (success/failure)
- JWT token validation
- Protected route access

**Screenshot naming:** `02-authentication-tests.png`

**Key tests to highlight:**
- ✓ should register a new user with valid data
- ✓ should reject registration with duplicate email
- ✓ should login with valid credentials
- ✓ should reject login with invalid credentials
- ✓ should get current user profile with valid token

---

### 3. Book Management Tests (Required)

**Command:**
```bash
npm test -- books.test.js
```

**What to capture:**
- Book CRUD operations
- Book creation with validation
- Book update/delete with authorization
- Search and filtering tests

**Screenshot naming:** `03-book-management-tests.png`

---

### 4. Trade System Tests (Required)

**Command:**
```bash
npm test -- trades.test.js
```

**What to capture:**
- Trade proposal tests
- Trade acceptance/decline
- Trade completion
- Authorization checks

**Screenshot naming:** `04-trade-system-tests.png`

---

### 5. Rating System Tests (Required)

**Command:**
```bash
npm test -- rating.test.js
```

**What to capture:**
- Rating submission
- Rating validation (comment requirement)
- Average rating calculation
- Duplicate prevention

**Screenshot naming:** `05-rating-system-tests.png`

---

### 6. Security Tests (Required)

**Command:**
```bash
npm test -- security.test.js password-hashing.test.js rate-limiting.test.js
```

**What to capture:**
- Password hashing tests
- Input validation
- Rate limiting
- CORS configuration

**Screenshot naming:** `06-security-tests.png`

---

### 7. Test Coverage Report (Recommended)

**Command:**
```bash
npm run test:coverage
```

**What to capture:**
- Coverage summary table
- Percentage coverage by file
- Statements, Branches, Functions, Lines coverage

**Screenshot naming:** `07-test-coverage.png`

**Then open the HTML report:**
```bash
open coverage/lcov-report/index.html
```

**Additional screenshot:** Coverage details page
**Screenshot naming:** `08-coverage-details.png`

---

## Screenshot Best Practices

### Terminal Preparation

1. **Clear the terminal:**
   ```bash
   clear
   ```

2. **Show current directory:**
   ```bash
   pwd
   ```

3. **Run the test command**

4. **Wait for completion** before taking screenshot

### Image Quality

- **Resolution**: Minimum 1920x1080
- **Format**: PNG (better quality than JPG)
- **Compression**: None or minimal
- **Cropping**: Include terminal header and full output

### What to Include in Each Screenshot

✓ Terminal window title/header
✓ Current directory path
✓ Full command executed
✓ Complete test output
✓ Test summary (passed/failed counts)
✓ Timestamp (if visible)

### What to Avoid

✗ Partial test output (scrolled)
✗ Blurry or low-resolution images
✗ Personal information in terminal
✗ Unrelated terminal content
✗ Error messages (unless documenting error handling)

---

## Creating a Screenshot Collection

### Option 1: Individual Test Suites (Recommended for Detailed Reports)

Run each test file separately and capture:

```bash
# 1. Authentication
npm test -- auth.test.js

# 2. Books
npm test -- books.test.js

# 3. Trades
npm test -- trades.test.js

# 4. Messages
npm test -- message.test.js

# 5. Ratings
npm test -- rating.test.js

# 6. Wishlist
npm test -- wishlist.test.js

# 7. Notifications
npm test -- notifications.test.js

# 8. Security
npm test -- security.test.js

# 9. Privacy
npm test -- privacy.test.js
```

### Option 2: Grouped Tests (Recommended for Summary Reports)

```bash
# Authentication & Authorization
npm test -- auth.test.js users.test.js

# Book Management
npm test -- books.test.js books-validation.test.js books-upload.test.js

# Trading System
npm test -- trades.test.js message.test.js

# Rating & Reviews
npm test -- rating.test.js rating-api.test.js

# Security Features
npm test -- security.test.js password-hashing.test.js rate-limiting.test.js cors-security.test.js
```

---

## Screenshot Organization

Create a folder structure:

```
screenshots/
├── 01-overview/
│   └── all-tests-overview.png
├── 02-authentication/
│   ├── auth-tests.png
│   └── jwt-validation.png
├── 03-books/
│   ├── book-crud.png
│   ├── book-validation.png
│   └── book-search.png
├── 04-trades/
│   └── trade-system.png
├── 05-ratings/
│   └── rating-system.png
├── 06-security/
│   ├── password-hashing.png
│   ├── rate-limiting.png
│   └── input-validation.png
└── 07-coverage/
    ├── coverage-summary.png
    └── coverage-details.png
```

---

## Annotating Screenshots for Reports

### Using Built-in Tools

**macOS Preview:**
1. Open screenshot in Preview
2. Click markup toolbar (pen icon)
3. Add arrows, text boxes, highlights
4. Save

**Windows Snip & Sketch:**
1. Open screenshot
2. Use pen, highlighter, or text tools
3. Save

### What to Annotate

- Circle or highlight key test results
- Add arrows pointing to important metrics
- Label sections (e.g., "Authentication Tests", "Security Tests")
- Highlight pass/fail counts
- Mark execution time

---

## Creating a Test Execution Video (Optional)

For a comprehensive demonstration:

1. **Screen Recording Tools:**
   - macOS: QuickTime Player (File > New Screen Recording)
   - Windows: Xbox Game Bar (Win+G)
   - Cross-platform: OBS Studio

2. **What to Record:**
   - Starting MongoDB
   - Running `npm test`
   - Showing all tests pass
   - Running coverage report
   - Opening coverage HTML report

3. **Video Length:** 2-5 minutes

4. **Narration:** Optional but helpful

---

## Troubleshooting Screenshot Issues

### Tests Scrolling Off Screen

**Solution 1:** Run individual test files
```bash
npm test -- auth.test.js
```

**Solution 2:** Increase terminal buffer size
- macOS Terminal: Preferences > Profiles > Scrollback
- Windows Terminal: Settings > Scrollback

**Solution 3:** Capture multiple screenshots and stitch together

### Terminal Too Small

- Maximize window before running tests
- Reduce font size slightly (but keep readable)
- Use full-screen mode

### Colors Not Showing

- Ensure terminal supports colors
- Check Jest configuration
- Use `--colors` flag: `npm test -- --colors`

---

## Quick Screenshot Workflow

1. **Prepare** (5 minutes)
   - Clean terminal
   - Adjust font size
   - Create screenshots folder

2. **Execute** (10 minutes)
   - Run all tests: `npm test`
   - Capture overview screenshot
   - Run individual test suites
   - Capture each screenshot

3. **Organize** (5 minutes)
   - Rename files with descriptive names
   - Move to organized folders
   - Review for quality

4. **Annotate** (10 minutes)
   - Add labels and highlights
   - Ensure clarity
   - Save annotated versions

**Total Time:** ~30 minutes

---

## Sample Screenshot Captions for Report

Use these captions in your Word document:

- **Figure 1:** Complete test suite execution showing all tests passed
- **Figure 2:** Authentication and authorization test results
- **Figure 3:** Book management CRUD operation tests
- **Figure 4:** Trade proposal and management test results
- **Figure 5:** Rating system validation and calculation tests
- **Figure 6:** Security feature tests including password hashing and rate limiting
- **Figure 7:** Test coverage summary showing X% overall coverage
- **Figure 8:** Detailed test coverage report by module

---

## Checklist Before Submission

- [ ] All screenshots are high resolution (minimum 1920x1080)
- [ ] Screenshots show complete test output (not cut off)
- [ ] File names are descriptive and numbered
- [ ] Screenshots are organized in folders
- [ ] Key results are highlighted or annotated
- [ ] Coverage report is included
- [ ] All tests show "PASS" status
- [ ] Timestamps are visible (if required)
- [ ] No personal/sensitive information visible
- [ ] Screenshots are in PNG format

---

## Additional Resources

- Test Report Generator: `node __tests__/generate-test-report.js`
- Test Documentation: `__tests__/README.md`
- Coverage Report: `npm run test:coverage`
- Verbose Output: `npm run test:verbose`
