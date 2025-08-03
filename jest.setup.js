import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock environment variables
process.env.ONEINCH_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id'

// Mock fetch globally
global.fetch = jest.fn()

// Add Request and Response to global scope
global.Request = globalThis.Request || class MockRequest {}
global.Response = globalThis.Response || class MockResponse {}
global.Headers = globalThis.Headers || class MockHeaders {}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}