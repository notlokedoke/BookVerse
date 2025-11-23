// Set up environment before requiring modules
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRE = '24h';

const { generateToken, verifyToken } = require('../utils/jwt');

describe('JWT Utility', () => {
  const testUserId = '507f1f77bcf86cd799439011';

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = generateToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts separated by dots
    });

    test('should include user ID in token payload', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(testUserId);
    });

    test('should set token expiration', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUserId);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    test('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => verifyToken(malformedToken)).toThrow('Invalid or expired token');
    });
  });
});
