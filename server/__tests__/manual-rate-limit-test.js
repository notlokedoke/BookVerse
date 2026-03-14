/**
 * Manual Rate Limiting Test
 * 
 * This script demonstrates rate limiting behavior in a non-test environment.
 * To test rate limiting manually:
 * 
 * 1. Temporarily comment out the skip function in server.js authLimiter
 * 2. Start the server: npm run dev
 * 3. Run this script: node __tests__/manual-rate-limit-test.js
 * 4. Observe that the 6th request returns 429 status
 * 
 * Note: This is for manual testing only. Automated tests skip rate limiting
 * to avoid flaky tests and long test execution times.
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testRateLimiting() {
  console.log('🧪 Testing Auth Endpoint Rate Limiting');
  console.log('Configuration: 5 requests per 15 minutes\n');

  for (let i = 1; i <= 7; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name: 'Test User',
        email: `test${i}@example.com`,
        password: 'password123',
        city: 'New York'
      });

      console.log(`✅ Request ${i}: Status ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 429) {
          console.log(`🚫 Request ${i}: Status ${status} - RATE LIMITED`);
          console.log(`   Error Code: ${data.error.code}`);
          console.log(`   Message: ${data.error.message}`);
        } else {
          console.log(`⚠️  Request ${i}: Status ${status} - ${data.error?.message || 'Error'}`);
        }
      } else {
        console.log(`❌ Request ${i}: Network error - ${error.message}`);
      }
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Test Complete');
  console.log('Expected: First 5 requests succeed or fail with validation errors');
  console.log('Expected: 6th and 7th requests return 429 (Rate Limited)');
}

// Check if server is running
axios.get(`${API_URL}/api/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    return testRateLimiting();
  })
  .catch((error) => {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   cd server && npm run dev');
    process.exit(1);
  });
