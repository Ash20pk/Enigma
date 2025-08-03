const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,ts,jsx,tsx}',
    'components/**/*.{js,ts,jsx,tsx}',
    'app/**/*.{js,ts,jsx,tsx}',
    '!app/**/_*.{js,ts,jsx,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)