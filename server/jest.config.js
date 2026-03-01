module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 60000, // Increased to 60 seconds
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  globalSetup: '<rootDir>/__tests__/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/globalTeardown.js',
  testMatch: ['**/__tests__/**/*.test.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  // Run tests serially to avoid connection issues
  maxWorkers: 1,
  // Detect open handles
  detectOpenHandles: false,
  forceExit: true
};
