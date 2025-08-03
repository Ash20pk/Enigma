import { oneInchService } from '../1inch'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock the fusion module
jest.mock('../fusion', () => ({
  fusionService: {
    getQuote: jest.fn(),
    createOrder: jest.fn(),
  },
}))

describe('OneInchService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('getTokens', () => {
    it('should fetch tokens for a given chain ID', async () => {
      const mockTokens = {
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48': {
          address: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      })

      const result = await oneInchService.getTokens(1)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/1inch/tokens?chainId=1',
        expect.objectContaining({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockTokens)
    })

    it('should handle errors when fetching tokens fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(oneInchService.getTokens(1)).rejects.toThrow(
        'Failed to fetch available tokens. Please try again.'
      )
    })

    it('should retry on network errors', async () => {
      const networkError = { code: 'ECONNABORTED' }
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      const result = await oneInchService.getTokens(1)
      expect(global.fetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ success: true })
    })
  })

  describe('getQuote', () => {
    it('should fetch quote for token swap', async () => {
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
        protocols: [],
        gas: 150000,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuote,
      })

      const result = await oneInchService.getQuote(
        1,
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        '1000000000000000000'
      )

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/1inch/quote?chainId=1&src=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&dst=0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48&amount=1000000000000000000',
        expect.any(Object)
      )
      expect(result).toEqual(mockQuote)
    })

    it('should handle quote fetch errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Quote error'))

      await expect(
        oneInchService.getQuote(1, 'token1', 'token2', '1000')
      ).rejects.toThrow(
        'Unable to get swap quote. Please check your token selection and amount.'
      )
    })
  })

  describe('getSwap', () => {
    it('should fetch swap transaction data', async () => {
      const mockSwap = {
        tx: {
          from: '0x123',
          to: '0x456',
          data: '0xabcd',
          value: '0',
          gas: '150000',
          gasPrice: '20000000000',
        },
        dstAmount: '1000000',
        srcToken: { address: 'token1', symbol: 'TOK1' },
        dstToken: { address: 'token2', symbol: 'TOK2' },
      }

      mockedAxios.get.mockResolvedValueOnce({ data: mockSwap })

      const result = await oneInchService.getSwap(
        1,
        'token1',
        'token2',
        '1000',
        '0x123',
        1
      )

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/1inch/swap?chainId=1&src=token1&dst=token2&amount=1000&from=0x123&slippage=1'
      )
      expect(result).toEqual(mockSwap)
    })
  })

  describe('executeSwap', () => {
    it('should execute swap successfully', async () => {
      const mockSwapResponse = {
        dstAmount: '1000000',
        tx: {
          from: '0x123',
          to: '0x456',
          data: '0xabcd',
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSwapResponse,
      })

      const result = await oneInchService.executeSwap(
        1,
        'token1',
        'token2',
        '1000',
        '0x123',
        1
      )

      expect(result).toEqual(mockSwapResponse)
    })

    it('should handle swap execution errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Swap failed'))

      await expect(
        oneInchService.executeSwap(1, 'token1', 'token2', '1000', '0x123')
      ).rejects.toThrow('Failed to execute swap. Please try again.')
    })
  })

  describe('getAllowance', () => {
    it('should fetch token allowance', async () => {
      const mockAllowance = { allowance: '1000000000000000000' }

      mockedAxios.get.mockResolvedValueOnce({ data: mockAllowance })

      const result = await oneInchService.getAllowance(
        1,
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        '0x123'
      )

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/1inch/allowance?chainId=1&tokenAddress=0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48&walletAddress=0x123'
      )
      expect(result).toEqual(mockAllowance)
    })
  })

  describe('getApproveTransaction', () => {
    it('should fetch approve transaction data', async () => {
      const mockApprove = {
        data: '0xabcd',
        gasPrice: '20000000000',
        to: '0x456',
        value: '0',
      }

      mockedAxios.get.mockResolvedValueOnce({ data: mockApprove })

      const result = await oneInchService.getApproveTransaction(
        1,
        '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
        '1000000'
      )

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/1inch/approve?chainId=1&tokenAddress=0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48&amount=1000000'
      )
      expect(result).toEqual(mockApprove)
    })
  })

  describe('getPortfolio', () => {
    it('should fetch portfolio data', async () => {
      const mockPortfolio = {
        result: [
          {
            token_address: '0x123',
            symbol: 'ETH',
            balance: '1000000000000000000',
            usd_value: 2000,
          },
        ],
      }

      mockedAxios.get.mockResolvedValueOnce({ data: mockPortfolio })

      const result = await oneInchService.getPortfolio(['0x123', '0x456'])

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/1inch/portfolio?addresses=0x123,0x456'
      )
      expect(result).toEqual(mockPortfolio.result)
    })

    it('should return empty array if no result', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} })

      const result = await oneInchService.getPortfolio(['0x123'])
      expect(result).toEqual([])
    })
  })

  describe('getPrices', () => {
    it('should fetch token prices', async () => {
      const mockPrices = {
        '0x123': 2000,
        '0x456': 1,
      }

      mockedAxios.get.mockResolvedValueOnce({ data: mockPrices })

      const result = await oneInchService.getPrices(1, ['0x123', '0x456'], 'USD')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/1inch/prices?chainId=1&addresses=0x123,0x456&currency=USD'
      )
      expect(result).toEqual(mockPrices)
    })
  })

  describe('getFusionQuote', () => {
    it('should fetch fusion quote', async () => {
      const mockQuote = {
        dstAmount: '1000000',
        quoteId: 'quote-123',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuote,
      })

      const result = await oneInchService.getFusionQuote(
        1,
        'token1',
        'token2',
        '1000',
        '0x123'
      )

      expect(result).toEqual(mockQuote)
    })
  })

  describe('submitFusionOrder', () => {
    it('should submit fusion order', async () => {
      const mockOrder = {
        orderHash: 'hash123',
        order: { id: 'order1' },
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockOrder })

      const orderData = {
        src: 'token1',
        dst: 'token2',
        amount: '1000',
        from: '0x123',
      }

      const result = await oneInchService.submitFusionOrder(1, orderData)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/1inch/fusion/swap',
        { chainId: 1, ...orderData },
        expect.any(Object)
      )
      expect(result).toEqual(mockOrder)
    })
  })

  describe('Cross-chain methods', () => {
    it('should call fusion service for cross-chain quote', async () => {
      const { fusionService } = require('../fusion')
      const mockQuote = { dstAmount: '1000', isCrossChain: true }
      
      fusionService.getQuote.mockResolvedValueOnce(mockQuote)

      const result = await oneInchService.getCrossChainQuote(
        1,
        137,
        'token1',
        'token2',
        '1000',
        '0x123'
      )

      expect(fusionService.getQuote).toHaveBeenCalledWith({
        fromTokenAddress: 'token1',
        toTokenAddress: 'token2',
        amount: '1000',
        walletAddress: '0x123',
        srcChainId: 1,
        dstChainId: 137,
      })
      expect(result).toEqual(mockQuote)
    })
  })

  describe('formatAmount', () => {
    it('should format amount with decimals', () => {
      const result = oneInchService.formatAmount('1', 18)
      expect(result).toBe('1000000000000000000')
    })

    it('should format amount with 6 decimals', () => {
      const result = oneInchService.formatAmount('1', 6)
      expect(result).toBe('1000000')
    })
  })

  describe('parseAmount', () => {
    it('should parse amount from wei', () => {
      const result = oneInchService.parseAmount('1000000000000000000', 18)
      expect(result).toBe('1')
    })

    it('should parse amount from 6 decimals', () => {
      const result = oneInchService.parseAmount('1000000', 6)
      expect(result).toBe('1')
    })
  })
})