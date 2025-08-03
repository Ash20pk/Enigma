import { oneInchService } from '@/lib/1inch'
import { fusionService } from '@/lib/fusion'

// Mock external dependencies
jest.mock('axios')
jest.mock('@1inch/fusion-sdk')
jest.mock('ethers')

describe('Swap Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ONEINCH_API_KEY = 'test-api-key'
    
    // Mock successful responses
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
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
        protocols: [],
        gas: 150000,
      }),
    })
  })

  describe('Classic Swap Flow', () => {
    it('should complete full classic swap flow', async () => {
      // 1. Get quote
      const quote = await oneInchService.getQuote(
        1, // Ethereum
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '1000000000000000000' // 1 ETH
      )

      expect(quote).toHaveProperty('dstAmount')
      expect(quote).toHaveProperty('srcToken')
      expect(quote).toHaveProperty('dstToken')
      expect(quote.srcToken.symbol).toBe('ETH')
      expect(quote.dstToken.symbol).toBe('USDC')

      // 2. Get swap data
      const mockSwapData = {
        tx: {
          from: '0x123',
          to: '0x456',
          data: '0xabcd',
          value: '1000000000000000000',
          gas: '150000',
          gasPrice: '20000000000',
        },
        ...quote,
      }

      jest.mocked(require('axios')).get.mockResolvedValueOnce({ data: mockSwapData })

      const swapData = await oneInchService.getSwap(
        1,
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        '1000000000000000000',
        '0x123456789abcdef',
        1 // 1% slippage
      )

      expect(swapData).toHaveProperty('tx')
      expect(swapData.tx).toHaveProperty('data')
      expect(swapData.tx).toHaveProperty('to')
      expect(swapData.tx.from).toBe('0x123')
    })

    it('should handle allowance check and approval flow', async () => {
      const tokenAddress = '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48'
      const walletAddress = '0x123456789abcdef'

      // Mock allowance response
      jest.mocked(require('axios')).get.mockResolvedValueOnce({
        data: { allowance: '0' }, // No allowance
      })

      const allowance = await oneInchService.getAllowance(1, tokenAddress, walletAddress)
      expect(allowance.allowance).toBe('0')

      // Mock approve transaction
      jest.mocked(require('axios')).get.mockResolvedValueOnce({
        data: {
          data: '0xapprove123',
          gasPrice: '20000000000',
          to: tokenAddress,
          value: '0',
        },
      })

      const approveData = await oneInchService.getApproveTransaction(1, tokenAddress, '1000000')
      expect(approveData).toHaveProperty('data')
      expect(approveData.to).toBe(tokenAddress)
    })
  })

  describe('Fusion Swap Flow', () => {
    it('should complete fusion swap flow', async () => {
      const mockFusionSDK = {
        getQuote: jest.fn().mockResolvedValue({
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
          gas: 0, // Gasless
          quoteId: 'fusion-quote-123',
        }),
        createOrder: jest.fn().mockResolvedValue({
          id: 'fusion-order-123',
          data: 'order-data',
        }),
        submitOrder: jest.fn().mockResolvedValue('0xfusion-hash-123'),
      }

      jest.mocked(require('@1inch/fusion-sdk').FusionSDK).mockImplementation(() => mockFusionSDK)

      // 1. Get Fusion quote
      const quote = await fusionService.getQuote({
        fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toTokenAddress: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000000000000000000',
        walletAddress: '0x123456789abcdef',
        srcChainId: 1,
      })

      expect(quote).toHaveProperty('quoteId')
      expect(quote).toHaveProperty('isCrossChain', false)
      expect(quote.gas).toBe(0) // Should be gasless

      // 2. Create order
      const orderResponse = await fusionService.createOrder({
        fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toTokenAddress: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000000000000000000',
        walletAddress: '0x123456789abcdef',
      })

      expect(orderResponse).toHaveProperty('order')
      expect(orderResponse).toHaveProperty('quoteId')

      // 3. Submit order
      const orderHash = await fusionService.submitOrder(
        orderResponse.order,
        orderResponse.quoteId,
        1
      )

      expect(orderHash).toBe('0xfusion-hash-123')
    })

    it('should handle cross-chain detection', async () => {
      await expect(
        fusionService.getQuote({
          fromTokenAddress: '0x1',
          toTokenAddress: '0x2',
          amount: '1000',
          walletAddress: '0x123',
          srcChainId: 1,
          dstChainId: 137, // Cross-chain
        })
      ).rejects.toThrow('Cross-chain swaps require special implementation')
    })
  })

  describe('Portfolio Integration', () => {
    it('should fetch and format portfolio data', async () => {
      const mockPortfolio = {
        result: [
          {
            token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '5000000000000000000', // 5 ETH
            usd_value: 10000,
            usd_value_24hr_usd_change: 200,
            portfolio_percentage: 80,
            price_24hr_percent_change: 2.5,
          },
          {
            token_address: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '2500000000', // 2500 USDC
            usd_value: 2500,
            usd_value_24hr_usd_change: 0,
            portfolio_percentage: 20,
            price_24hr_percent_change: 0,
          },
        ],
      }

      jest.mocked(require('axios')).get.mockResolvedValueOnce({ data: mockPortfolio })

      const portfolio = await oneInchService.getPortfolio(['0x123456789abcdef'])

      expect(portfolio).toHaveLength(2)
      expect(portfolio[0].symbol).toBe('ETH')
      expect(portfolio[0].usd_value).toBe(10000)
      expect(portfolio[1].symbol).toBe('USDC')
      expect(portfolio[1].usd_value).toBe(2500)
    })

    it('should fetch real-time prices', async () => {
      const mockPrices = {
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 2500.5,
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48': 1.0,
      }

      jest.mocked(require('axios')).get.mockResolvedValueOnce({ data: mockPrices })

      const prices = await oneInchService.getPrices(
        1,
        ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48'],
        'USD'
      )

      expect(prices).toHaveProperty('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      expect(prices['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee']).toBe(2500.5)
      expect(prices['0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48']).toBe(1.0)
    })
  })

  describe('Cross-Chain Integration', () => {
    it('should redirect cross-chain requests to fusion service', async () => {
      const fusionSpy = jest.spyOn(fusionService, 'getQuote').mockResolvedValue({
        dstAmount: '1000000',
        srcToken: { address: '0x1', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        dstToken: { address: '0x2', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        gas: 0,
        quoteId: 'cross-chain-quote',
        isCrossChain: true,
      })

      await oneInchService.getCrossChainQuote(
        1, // Ethereum
        137, // Polygon
        '0x1',
        '0x2',
        '1000',
        '0x123'
      )

      expect(fusionSpy).toHaveBeenCalledWith({
        fromTokenAddress: '0x1',
        toTokenAddress: '0x2',
        amount: '1000',
        walletAddress: '0x123',
        srcChainId: 1,
        dstChainId: 137,
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit error
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
      })

      await expect(
        oneInchService.getQuote(1, '0x1', '0x2', '1000')
      ).rejects.toThrow('Unable to get swap quote')
    })

    it('should handle network timeouts with retry', async () => {
      // Mock timeout, then success
      global.fetch = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNABORTED' })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ dstAmount: '1000' }),
        })

      const quote = await oneInchService.getQuote(1, '0x1', '0x2', '1000')
      expect(quote).toHaveProperty('dstAmount', '1000')
    })

    it('should handle invalid token addresses', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      await expect(
        oneInchService.getQuote(1, 'invalid-address', '0x2', '1000')
      ).rejects.toThrow('Unable to get swap quote')
    })
  })

  describe('Amount Formatting Integration', () => {
    it('should correctly format and parse amounts', () => {
      // ETH (18 decimals)
      const ethAmount = oneInchService.formatAmount('1', 18)
      expect(ethAmount).toBe('1000000000000000000')

      const parsedEth = oneInchService.parseAmount(ethAmount, 18)
      expect(parsedEth).toBe('1')

      // USDC (6 decimals)
      const usdcAmount = oneInchService.formatAmount('1000', 6)
      expect(usdcAmount).toBe('1000000000')

      const parsedUsdc = oneInchService.parseAmount(usdcAmount, 6)
      expect(parsedUsdc).toBe('1000')
    })
  })
})