/**
 * Simplified test for the 1inch service functions
 */

describe('1inch Service Functions', () => {
  describe('Basic functionality', () => {
    it('should be able to import the service', () => {
      const { oneInchService } = require('../1inch')
      expect(oneInchService).toBeDefined()
      expect(typeof oneInchService.formatAmount).toBe('function')
      expect(typeof oneInchService.parseAmount).toBe('function')
    })

    it('should format amounts correctly', () => {
      const { oneInchService } = require('../1inch')
      
      // Test ETH (18 decimals)
      expect(oneInchService.formatAmount('1', 18)).toBe('1000000000000000000')
      expect(oneInchService.formatAmount('0.5', 18)).toBe('500000000000000000')
      
      // Test USDC (6 decimals)
      expect(oneInchService.formatAmount('1000', 6)).toBe('1000000000')
      expect(oneInchService.formatAmount('1', 6)).toBe('1000000')
    })

    it('should parse amounts correctly', () => {
      const { oneInchService } = require('../1inch')
      
      // Test ETH (18 decimals)
      expect(oneInchService.parseAmount('1000000000000000000', 18)).toBe('1')
      expect(oneInchService.parseAmount('500000000000000000', 18)).toBe('0')
      
      // Test USDC (6 decimals)
      expect(oneInchService.parseAmount('1000000000', 6)).toBe('1000')
      expect(oneInchService.parseAmount('1000000', 6)).toBe('1')
    })
  })

  describe('Error handling', () => {
    it('should handle BigInt conversion safely', () => {
      const { oneInchService } = require('../1inch')
      
      // Should not throw for valid numeric strings
      expect(() => oneInchService.formatAmount('1', 18)).not.toThrow()
      expect(() => oneInchService.parseAmount('1000000000000000000', 18)).not.toThrow()
    })
  })
})