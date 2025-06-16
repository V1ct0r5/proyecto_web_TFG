require('dotenv').config({ path: './.env.test' });

module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  rootDir: '.', 
  testMatch: ['<rootDir>/tests/backend/unit/**/*.test.js'], 
  collectCoverage: true,
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
  },
  clearMocks: true,
};