/**
 * Simplified test for the Fusion service functions
 */

describe('Fusion Service Functions', () => {
  describe('Basic functionality', () => {
    it('should be able to import the service', () => {
      const { fusionService } = require('../fusion')
      expect(fusionService).toBeDefined()
      expect(typeof fusionService.isCrossChainSupported).toBe('function')
      expect(typeof fusionService.getSupportedChains).toBe('function')
    })

    it('should check cross-chain support correctly', () => {
      const { fusionService } = require('../fusion')
      
      // Test supported chains
      expect(fusionService.isCrossChainSupported(1, 137)).toBe(true) // ETH to Polygon
      expect(fusionService.isCrossChainSupported(1, 56)).toBe(true)  // ETH to BSC
      expect(fusionService.isCrossChainSupported(137, 42161)).toBe(true) // Polygon to Arbitrum
      
      // Test unsupported chains
      expect(fusionService.isCrossChainSupported(1, 999)).toBe(false)
      expect(fusionService.isCrossChainSupported(999, 1)).toBe(false)
      expect(fusionService.isCrossChainSupported(123, 456)).toBe(false)
    })

    it('should return supported chains list', () => {
      const { fusionService } = require('../fusion')
      
      const chains = fusionService.getSupportedChains()
      
      expect(Array.isArray(chains)).toBe(true)
      expect(chains.length).toBe(6)
      
      // Check first few chains
      expect(chains[0]).toEqual({
        chainId: 1,
        name: 'Ethereum',
        network: expect.any(Number), // NetworkEnum value
      })
      
      expect(chains[1]).toEqual({
        chainId: 56,
        name: 'BSC',
        network: expect.any(Number),
      })
      
      // Check all chains have required properties
      chains.forEach(chain => {
        expect(chain).toHaveProperty('chainId')
        expect(chain).toHaveProperty('name')
        expect(chain).toHaveProperty('network')
        expect(typeof chain.chainId).toBe('number')
        expect(typeof chain.name).toBe('string')
      })
    })
  })

  describe('Network utilities', () => {
    it('should handle same chain correctly', () => {
      const { fusionService } = require('../fusion')
      
      // Same chain should be supported
      expect(fusionService.isCrossChainSupported(1, 1)).toBe(true)
      expect(fusionService.isCrossChainSupported(137, 137)).toBe(true)
    })

    it('should have all major chains', () => {
      const { fusionService } = require('../fusion')
      
      const chains = fusionService.getSupportedChains()
      const chainIds = chains.map(c => c.chainId)
      
      // Check for major chains
      expect(chainIds).toContain(1)     // Ethereum
      expect(chainIds).toContain(56)    // BSC
      expect(chainIds).toContain(137)   // Polygon
      expect(chainIds).toContain(42161) // Arbitrum
      expect(chainIds).toContain(10)    // Optimism
      expect(chainIds).toContain(8453)  // Base
    })
  })
})