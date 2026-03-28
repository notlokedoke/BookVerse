/**
 * Test Report Generator
 * 
 * This script runs all tests and generates a formatted report
 * suitable for academic documentation and Word documents.
 * 
 * Usage:
 *   node __tests__/generate-test-report.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║         BookVerse Backend Test Report Generator           ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = path.join(__dirname, 'reports');
const reportFile = path.join(reportDir, `test-report-${timestamp}.txt`);
const jsonReportFile = path.join(reportDir, `test-report-${timestamp}.json`);

// Create reports directory if it doesn't exist
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
  console.log(`${colors.green}✓${colors.reset} Created reports directory`);
}

console.log(`${colors.cyan}Running all tests...${colors.reset}\n`);

try {
  // Run tests with JSON output
  const testOutput = execSync(
    'npm test -- --json --outputFile=__tests__/reports/test-results.json --verbose',
    { 
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    }
  );

  console.log(testOutput);

  // Read the JSON results
  const jsonResultsPath = path.join(reportDir, 'test-results.json');
  let testResults;
  
  if (fs.existsSync(jsonResultsPath)) {
    testResults = JSON.parse(fs.readFileSync(jsonResultsPath, 'utf-8'));
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} JSON results not found, generating basic report`);
    testResults = { success: true, numPassedTests: 'N/A', numFailedTests: 0 };
  }

  // Generate formatted text report
  const report = generateTextReport(testResults, testOutput);
  fs.writeFileSync(reportFile, report);

  console.log(`\n${colors.green}${colors.bright}✓ Test Report Generated Successfully!${colors.reset}`);
  console.log(`${colors.cyan}Text Report:${colors.reset} ${reportFile}`);
  if (fs.existsSync(jsonReportFile)) {
    console.log(`${colors.cyan}JSON Report:${colors.reset} ${jsonReportFile}`);
  }
  
  console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
  console.log(`1. Open the text report in a text editor`);
  console.log(`2. Copy sections into your Word document`);
  console.log(`3. Take screenshots of test execution (see screenshot-guide.md)`);
  console.log(`4. Run individual test suites for detailed screenshots\n`);

} catch (error) {
  console.error(`${colors.red}✗ Error running tests:${colors.reset}`, error.message);
  
  // Generate error report
  const errorReport = generateErrorReport(error);
  fs.writeFileSync(reportFile, errorReport);
  
  console.log(`${colors.yellow}Error report saved to:${colors.reset} ${reportFile}`);
  process.exit(1);
}

function generateTextReport(results, output) {
  const date = new Date().toLocaleString();
  
  return `
╔════════════════════════════════════════════════════════════════════════════╗
║                    BOOKVERSE BACKEND TEST REPORT                           ║
╚════════════════════════════════════════════════════════════════════════════╝

Generated: ${date}
Project: BookVerse - Book Trading Platform
Technology Stack: Node.js, Express.js, MongoDB, Jest, Supertest

═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Test Framework: Jest v29.7.0
Test Runner: Supertest v6.3.4
Database: MongoDB (Test Database)
Environment: Test

Total Test Suites: ${results.numTotalTestSuites || 'N/A'}
Total Tests: ${results.numTotalTests || 'N/A'}
Passed Tests: ${results.numPassedTests || 'N/A'}
Failed Tests: ${results.numFailedTests || 0}
Test Duration: ${results.testResults ? (results.testResults.reduce((acc, suite) => acc + (suite.perfStats?.runtime || 0), 0) / 1000).toFixed(2) + 's' : 'N/A'}

Status: ${results.success ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}

═══════════════════════════════════════════════════════════════════════════════

TEST COVERAGE BY FEATURE
═══════════════════════════════════════════════════════════════════════════════

The following features have been tested:

1. Authentication & Authorization
   - User Registration
   - User Login
   - JWT Token Generation and Validation
   - Protected Route Access
   - Profile Management

2. Book Management
   - Book Creation (CRUD)
   - Book Listing with Image Upload
   - Book Search and Filtering
   - ISBN Lookup Integration
   - Book Validation

3. Trade System
   - Trade Proposal
   - Trade Acceptance/Decline
   - Trade Completion
   - Trade Authorization

4. Communication
   - Trade-specific Messaging
   - Message Validation
   - Message Authorization

5. Rating System
   - Rating Submission
   - Rating Validation
   - Average Rating Calculation
   - Duplicate Rating Prevention

6. Wishlist Management
   - Wishlist Creation
   - Wishlist Retrieval
   - Wishlist Deletion

7. Notification System
   - Notification Creation
   - Notification Retrieval
   - Mark as Read Functionality

8. Security Features
   - Password Hashing (bcrypt)
   - Input Validation
   - Rate Limiting
   - CORS Configuration
   - Security Headers

9. Privacy Controls
   - Privacy Settings Management
   - City Visibility Toggle
   - Privacy Application in Responses

═══════════════════════════════════════════════════════════════════════════════

DETAILED TEST RESULTS
═══════════════════════════════════════════════════════════════════════════════

${output}

═══════════════════════════════════════════════════════════════════════════════

TEST METHODOLOGY
═══════════════════════════════════════════════════════════════════════════════

Testing Approach:
- Unit Testing: Individual functions and components
- Integration Testing: API endpoints with database
- End-to-End Testing: Complete user workflows

Test Database:
- Separate test database (bookverse-test)
- Isolated from development and production data
- Automatic cleanup between tests

Test Data:
- Programmatically generated test data
- Consistent and reproducible test scenarios
- Comprehensive edge case coverage

Assertions:
- HTTP status code validation
- Response body structure validation
- Database state verification
- Error message validation
- Authorization and authentication checks

═══════════════════════════════════════════════════════════════════════════════

CONCLUSION
═══════════════════════════════════════════════════════════════════════════════

${results.success 
  ? 'All tests passed successfully, demonstrating that the BookVerse backend API\nmeets all functional requirements and handles edge cases appropriately.\nThe system is ready for deployment.'
  : 'Some tests failed. Please review the detailed results above and address\nthe failing tests before deployment.'}

═══════════════════════════════════════════════════════════════════════════════

For questions or issues, please refer to:
- Test Documentation: server/__tests__/README.md
- Test Utilities: server/__tests__/test-utils.js
- Individual Test Files: server/__tests__/*.test.js

═══════════════════════════════════════════════════════════════════════════════
`;
}

function generateErrorReport(error) {
  const date = new Date().toLocaleString();
  
  return `
╔════════════════════════════════════════════════════════════════════════════╗
║                    BOOKVERSE BACKEND TEST ERROR REPORT                     ║
╚════════════════════════════════════════════════════════════════════════════╝

Generated: ${date}

ERROR OCCURRED DURING TEST EXECUTION

Error Message:
${error.message}

Error Output:
${error.stdout || 'No output available'}

Error Details:
${error.stderr || 'No error details available'}

═══════════════════════════════════════════════════════════════════════════════

TROUBLESHOOTING STEPS:

1. Ensure MongoDB is running:
   mongod

2. Verify test database connection:
   Check MONGODB_URI in .env.test

3. Install dependencies:
   npm install

4. Run tests manually:
   npm test

5. Check individual test files for syntax errors

═══════════════════════════════════════════════════════════════════════════════
`;
}
