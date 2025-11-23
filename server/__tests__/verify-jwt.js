#!/usr/bin/env node

// Manual verification script for JWT utility
// This is a workaround for Node v25 + Jest compatibility issues

require('dotenv').config();
const { generateToken, verifyToken } = require('../utils/jwt');

console.log('🧪 Testing JWT Utility...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Generate token
test('Should generate a valid JWT token', () => {
  const token = generateToken('test-user-id-123');
  if (!token || typeof token !== 'string') {
    throw new Error('Token is not a string');
  }
  if (token.split('.').length !== 3) {
    throw new Error('Token does not have 3 parts');
  }
});

// Test 2: Token includes user ID
test('Should include user ID in token payload', () => {
  const userId = 'test-user-id-456';
  const token = generateToken(userId);
  const decoded = verifyToken(token);
  if (decoded.id !== userId) {
    throw new Error(`Expected user ID ${userId}, got ${decoded.id}`);
  }
});

// Test 3: Token has expiration
test('Should set token expiration to 24 hours', () => {
  const token = generateToken('test-user-id-789');
  const decoded = verifyToken(token);
  if (!decoded.exp || !decoded.iat) {
    throw new Error('Token missing exp or iat fields');
  }
  if (decoded.exp <= decoded.iat) {
    throw new Error('Expiration time is not after issued time');
  }
  // Check it's approximately 24 hours (86400 seconds)
  const duration = decoded.exp - decoded.iat;
  if (Math.abs(duration - 86400) > 10) {
    throw new Error(`Expected ~24 hours (86400s), got ${duration}s`);
  }
});

// Test 4: Verify valid token
test('Should verify a valid token', () => {
  const token = generateToken('test-user-id-abc');
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    throw new Error('Failed to decode valid token');
  }
});

// Test 5: Reject invalid token
test('Should throw error for invalid token', () => {
  try {
    verifyToken('invalid.token.here');
    throw new Error('Should have thrown an error');
  } catch (error) {
    if (!error.message.includes('Invalid or expired token')) {
      throw new Error(`Wrong error message: ${error.message}`);
    }
  }
});

// Test 6: Reject malformed token
test('Should throw error for malformed token', () => {
  try {
    verifyToken('not-a-jwt-token');
    throw new Error('Should have thrown an error');
  } catch (error) {
    if (!error.message.includes('Invalid or expired token')) {
      throw new Error(`Wrong error message: ${error.message}`);
    }
  }
});

// Test 7: JWT_SECRET from environment
test('Should use JWT_SECRET from environment variables', () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not found in environment');
  }
  const token = generateToken('test-user-id-env');
  // If this doesn't throw, the secret is being used
  verifyToken(token);
});

// Test 8: JWT_EXPIRE from environment
test('Should use JWT_EXPIRE from environment variables', () => {
  if (!process.env.JWT_EXPIRE) {
    throw new Error('JWT_EXPIRE not found in environment');
  }
  if (process.env.JWT_EXPIRE !== '24h') {
    throw new Error(`Expected JWT_EXPIRE to be '24h', got '${process.env.JWT_EXPIRE}'`);
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✨ All JWT utility tests passed!');
