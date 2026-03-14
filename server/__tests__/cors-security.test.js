const request = require('supertest');
const app = require('../server');

describe('CORS Security Configuration', () => {
  describe('CORS Headers', () => {
    it('should allow requests from whitelisted frontend domain', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe(
        process.env.FRONTEND_URL || 'http://localhost:3000'
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should not allow requests from non-whitelisted domains', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com');

      // CORS middleware should not set the allow-origin header for non-whitelisted origins
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });

    it('should allow only specified HTTP methods', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-methods']).toMatch(/GET/);
      expect(response.headers['access-control-allow-methods']).toMatch(/POST/);
      expect(response.headers['access-control-allow-methods']).toMatch(/PUT/);
      expect(response.headers['access-control-allow-methods']).toMatch(/DELETE/);
    });

    it('should reject disallowed HTTP methods', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'PATCH');

      // PATCH should not be in the allowed methods
      const allowedMethods = response.headers['access-control-allow-methods'] || '';
      expect(allowedMethods).not.toMatch(/PATCH/);
    });

    it('should allow only specified headers', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(response.headers['access-control-allow-headers']).toMatch(/Content-Type/);
      expect(response.headers['access-control-allow-headers']).toMatch(/Authorization/);
    });

    it('should set max-age for preflight caching', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-max-age']).toBe('600');
    });
  });

  describe('Helmet Security Headers', () => {
    it('should set security headers with helmet', async () => {
      const response = await request(app).get('/api/health');

      // Helmet should set various security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toMatch(/default-src/);
    });
  });

  describe('Credentials Support', () => {
    it('should allow credentials in CORS requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});
