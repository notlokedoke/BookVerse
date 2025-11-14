module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
