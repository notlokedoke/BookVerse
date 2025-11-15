// Test setup file
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookverse-test';
process.env.JWT_SECRET = 'test_jwt_secret';
