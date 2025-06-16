module.exports = {
    displayName: 'integration',
    testEnvironment: 'node',
    testMatch: ['**/tests/backend/integration/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/backend/src/$1',
    },
    forceExit: true,
    detectOpenHandles: true,
  };