module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Use node environment for Puppeteer
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/smoke.test.ts'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup-puppeteer.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 60000, // 60 seconds for Puppeteer tests with browser launch
  verbose: true,
  // Ensure tests run serially to avoid browser conflicts
  maxConcurrency: 1,
  maxWorkers: 1
};