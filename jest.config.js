module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: [
    '/node_modules/(?!chai)/',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest', // Usa babel-jest para transformar los archivos .js
  },
  globalTeardown: '<rootDir>/global-teardown.js'
};