import { fusionService } from '../fusion'
import { FusionSDK, NetworkEnum, PrivateKeyProviderConnector } from '@1inch/fusion-sdk'
import { JsonRpcProvider } from 'ethers'

// Mock the 1inch Fusion SDK
jest.mock('@1inch/fusion-sdk', () => ({
  FusionSDK: jest.fn(),
  NetworkEnum: {
    ETHEREUM: 1,
    BINANCE: 56,
    POLYGON: 137,
    ARBITRUM: 42161,
    OPTIMISM: 10,
    BASE: 8453,
  },
  PrivateKeyProviderConnector: jest.fn(),
}))

// Mock ethers
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn(),
}))

const mockSDK = {
  getQuote: jest.fn(),
  createOrder: jest.fn(),
  submitOrder: jest.fn(),
  getOrderStatus: jest.fn(),
}

const MockedFusionSDK = FusionSDK as jest.MockedClass<typeof FusionSDK>
const MockedPrivateKeyProviderConnector = PrivateKeyProviderConnector as jest.MockedClass<typeof PrivateKeyProviderConnector>
const MockedJsonRpcProvider = JsonRpcProvider as jest.MockedClass<typeof JsonRpcProvider>

describe('FusionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockedFusionSDK.mockImplementation(() => mockSDK as any)
    MockedPrivateKeyProviderConnector.mockImplementation(() => ({}) as any)
    MockedJsonRpcProvider.mockImplementation(() => ({}) as any)
    
    // Set up environment variable
    process.env.ONEINCH_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    // Clear the SDK instances cache
    ;(fusionService as any).sdkInstances.clear()
  })

  describe('getQuote', () => {
    it('should get quote for same-chain swap', async () => {
      const mockQuote = {
        dstAmount: '1000000',
        srcToken: {
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
        },
        dstToken: {
          address: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        gas: 150000,
        quoteId: 'quote-123',
      }

      mockSDK.getQuote.mockResolvedValueOnce(mockQuote)

      const result = await fusionService.getQuote({
        fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toTokenAddress: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000000000000000000',
        walletAddress: '0x123',
        srcChainId: 1,
      })

      expect(mockSDK.getQuote).toHaveBeenCalledWith({
        fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toTokenAddress: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000000000000000000',
        walletAddress: '0x123',
      })

      expect(result).toEqual({
        dstAmount: '1000000',
        srcToken: mockQuote.srcToken,
        dstToken: mockQuote.dstToken,
        gas: 150000,
        quoteId: 'quote-123',
        isCrossChain: false,
      })
    })

    it('should throw error for cross-chain swaps', async () => {
      await expect(
        fusionService.getQuote({
          fromTokenAddress: '0xtoken1',
          toTokenAddress: '0xtoken2',
          amount: '1000',
          walletAddress: '0x123',
          srcChainId: 1,
          dstChainId: 137, // Different chain
        })
      ).rejects.toThrow('Cross-chain swaps require special implementation')
    })

    it('should handle SDK errors', async () => {
      mockSDK.getQuote.mockRejectedValueOnce(new Error('SDK Error'))

      await expect(
        fusionService.getQuote({
          fromTokenAddress: '0xtoken1',
          toTokenAddress: '0xtoken2',
          amount: '1000',
          walletAddress: '0x123',
          srcChainId: 1,
        })
      ).rejects.toThrow('Failed to get Fusion quote: SDK Error')
    })

    it('should handle unknown errors', async () => {
      mockSDK.getQuote.mockRejectedValueOnce('Unknown error')

      await expect(
        fusionService.getQuote({
          fromTokenAddress: '0xtoken1',
          toTokenAddress: '0xtoken2',
          amount: '1000',
          walletAddress: '0x123',
          srcChainId: 1,
        })
      ).rejects.toThrow('Failed to get Fusion quote: Unknown error')
    })
  })

  describe('createOrder', () => {
    it('should create fusion order', async () => {
      const mockQuote = {
        dstAmount: '1000000',
        srcToken: { address: '0x1', symbol: 'TOK1', name: 'Token1', decimals: 18 },
        dstToken: { address: '0x2', symbol: 'TOK2', name: 'Token2', decimals: 6 },
        gas: 150000,
        quoteId: 'quote-123',
      }

      const mockOrder = {
        id: 'order-123',
        fromToken: '0x1',
        toToken: '0x2',
      }

      mockSDK.getQuote.mockResolvedValueOnce(mockQuote)
      mockSDK.createOrder.mockResolvedValueOnce(mockOrder)

      const result = await fusionService.createOrder({
        fromTokenAddress: '0x1',
        toTokenAddress: '0x2',
        amount: '1000',
        walletAddress: '0x123',
        receiver: '0x456',
        srcChainId: 1,
      })

      expect(mockSDK.createOrder).toHaveBeenCalledWith({
        fromTokenAddress: '0x1',
        toTokenAddress: '0x2',
        amount: '1000',
        walletAddress: '0x123',
        receiver: '0x456',
        permit: undefined,
      })

      expect(result).toEqual({
        orderHash: '',
        order: mockOrder,
        quoteId: 'quote-123',
      })
    })

    it('should handle order creation errors', async () => {
      mockSDK.getQuote.mockResolvedValueOnce({
        quoteId: 'quote-123',
        dstAmount: '1000',
        srcToken: { address: '0x1', symbol: 'TOK1', name: 'Token1', decimals: 18 },
        dstToken: { address: '0x2', symbol: 'TOK2', name: 'Token2', decimals: 6 },
        gas: 150000,
      })
      mockSDK.createOrder.mockRejectedValueOnce(new Error('Order creation failed'))

      await expect(
        fusionService.createOrder({
          fromTokenAddress: '0x1',
          toTokenAddress: '0x2',
          amount: '1000',
          walletAddress: '0x123',
        })
      ).rejects.toThrow('Failed to create Fusion order: Order creation failed')
    })
  })

  describe('submitOrder', () => {
    it('should submit order successfully', async () => {
      const mockOrderHash = '0xabcd1234'
      mockSDK.submitOrder.mockResolvedValueOnce(mockOrderHash)

      const result = await fusionService.submitOrder(
        { id: 'order-123' },
        'quote-123',
        1
      )

      expect(mockSDK.submitOrder).toHaveBeenCalledWith({ id: 'order-123' }, 'quote-123')
      expect(result).toBe(mockOrderHash)
    })

    it('should handle submission errors', async () => {
      mockSDK.submitOrder.mockRejectedValueOnce(new Error('Submission failed'))

      await expect(
        fusionService.submitOrder({ id: 'order-123' }, 'quote-123', 1)
      ).rejects.toThrow('Failed to submit Fusion order: Submission failed')
    })
  })

  describe('getOrderStatus', () => {
    it('should get order status', async () => {
      const mockStatus = {
        status: 'filled',
        txHash: '0x123',
      }

      mockSDK.getOrderStatus.mockResolvedValueOnce(mockStatus)

      const result = await fusionService.getOrderStatus('order-hash-123', 1)

      expect(mockSDK.getOrderStatus).toHaveBeenCalledWith('order-hash-123')
      expect(result).toEqual(mockStatus)
    })

    it('should handle status fetch errors', async () => {
      mockSDK.getOrderStatus.mockRejectedValueOnce(new Error('Status fetch failed'))

      await expect(
        fusionService.getOrderStatus('order-hash-123', 1)
      ).rejects.toThrow('Failed to get order status: Status fetch failed')
    })
  })

  describe('Network utilities', () => {
    it('should check cross-chain support correctly', () => {
      expect(fusionService.isCrossChainSupported(1, 137)).toBe(true)
      expect(fusionService.isCrossChainSupported(1, 999)).toBe(false)
      expect(fusionService.isCrossChainSupported(999, 1)).toBe(false)
    })

    it('should return supported chains', () => {
      const chains = fusionService.getSupportedChains()
      
      expect(chains).toHaveLength(6)
      expect(chains[0]).toEqual({
        chainId: 1,
        name: 'Ethereum',
        network: NetworkEnum.ETHEREUM,
      })
      expect(chains[1]).toEqual({
        chainId: 56,
        name: 'BSC',
        network: NetworkEnum.BINANCE,
      })
    })
  })

  describe('SDK initialization', () => {
    it('should throw error for unsupported chain ID', async () => {
      await expect(
        fusionService.getQuote({
          fromTokenAddress: '0x1',
          toTokenAddress: '0x2',
          amount: '1000',
          walletAddress: '0x123',
          srcChainId: 999, // Unsupported chain
        })
      ).rejects.toThrow('Unsupported chain ID: 999')
    })

    it('should initialize SDK with correct parameters', async () => {
      mockSDK.getQuote.mockResolvedValueOnce({
        dstAmount: '1000',
        srcToken: { address: '0x1', symbol: 'TOK1', name: 'Token1', decimals: 18 },
        dstToken: { address: '0x2', symbol: 'TOK2', name: 'Token2', decimals: 6 },
        gas: 150000,
        quoteId: 'quote-123',
      })

      await fusionService.getQuote({
        fromTokenAddress: '0x1',
        toTokenAddress: '0x2',
        amount: '1000',
        walletAddress: '0x123',
        srcChainId: 137, // Polygon
      })

      expect(MockedFusionSDK).toHaveBeenCalledWith({
        url: 'https://api.1inch.dev/fusion',
        network: NetworkEnum.POLYGON,
        blockchainProvider: expect.any(Object),
        authKey: 'test-api-key',
      })
    })

    it('should reuse SDK instances for same chain', async () => {
      mockSDK.getQuote.mockResolvedValue({
        dstAmount: '1000',
        srcToken: { address: '0x1', symbol: 'TOK1', name: 'Token1', decimals: 18 },
        dstToken: { address: '0x2', symbol: 'TOK2', name: 'Token2', decimals: 6 },
        gas: 150000,
        quoteId: 'quote-123',
      })

      // Call twice with same chain
      await fusionService.getQuote({
        fromTokenAddress: '0x1',
        toTokenAddress: '0x2',
        amount: '1000',
        walletAddress: '0x123',
        srcChainId: 1,
      })

      await fusionService.getQuote({
        fromTokenAddress: '0x1',
        toTokenAddress: '0x2',
        amount: '2000',
        walletAddress: '0x123',
        srcChainId: 1,
      })

      // SDK should only be created once
      expect(MockedFusionSDK).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error handling', () => {
    it('should handle missing API key', () => {
      delete process.env.ONEINCH_API_KEY
      
      // Create a new service instance to test the warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Import and create new instance
      jest.resetModules()
      const { FusionService } = require('../fusion')
      new FusionService()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '1inch API key not found. Fusion SDK will not work properly.'
      )
      
      consoleSpy.mockRestore()
      // Restore API key
      process.env.ONEINCH_API_KEY = 'test-api-key'
    })
  })
})