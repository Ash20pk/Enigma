import { GET } from '../fusion/quote/route'
import { NextRequest } from 'next/server'
import { fusionService } from '@/lib/fusion'

// Mock the fusion service
jest.mock('@/lib/fusion', () => ({
  fusionService: {
    getQuote: jest.fn(),
  },
}))

const mockedFusionService = fusionService as jest.Mocked<typeof fusionService>

describe('/api/1inch/fusion/quote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return fusion quote for valid parameters', async () => {
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
      isCrossChain: false,
    }

    mockedFusionService.getQuote.mockResolvedValueOnce(mockQuote)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/quote?chainId=1&src=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&dst=0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48&amount=1000000000000000000&from=0x123'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockQuote)
    expect(mockedFusionService.getQuote).toHaveBeenCalledWith({
      fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      toTokenAddress: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
      amount: '1000000000000000000',
      walletAddress: '0x123',
      srcChainId: 1,
      dstChainId: undefined,
    })
  })

  it('should handle cross-chain quote parameters', async () => {
    const mockQuote = {
      dstAmount: '1000000',
      srcToken: { address: '0x1', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      dstToken: { address: '0x2', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      gas: 150000,
      quoteId: 'quote-456',
      isCrossChain: true,
    }

    mockedFusionService.getQuote.mockResolvedValueOnce(mockQuote)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/quote?chainId=1&src=0x1&dst=0x2&amount=1000&from=0x123&dstChainId=137'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockedFusionService.getQuote).toHaveBeenCalledWith({
      fromTokenAddress: '0x1',
      toTokenAddress: '0x2',
      amount: '1000',
      walletAddress: '0x123',
      srcChainId: 1,
      dstChainId: 137,
    })
  })

  it('should return 400 for missing required parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/quote?chainId=1&src=0x1'
      // Missing dst, amount, from
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameters: src, dst, amount, from')
  })

  it('should handle fusion service errors', async () => {
    mockedFusionService.getQuote.mockRejectedValueOnce(new Error('Fusion service error'))

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/quote?chainId=1&src=0x1&dst=0x2&amount=1000&from=0x123'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Fusion service error')
  })

  it('should handle unknown errors', async () => {
    mockedFusionService.getQuote.mockRejectedValueOnce('Unknown error string')

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/quote?chainId=1&src=0x1&dst=0x2&amount=1000&from=0x123'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch Fusion quote')
  })

  it('should use default chainId when not provided', async () => {
    const mockQuote = {
      dstAmount: '1000',
      srcToken: { address: '0x1', symbol: 'TOK1', name: 'Token1', decimals: 18 },
      dstToken: { address: '0x2', symbol: 'TOK2', name: 'Token2', decimals: 6 },
      gas: 150000,
      quoteId: 'quote-789',
      isCrossChain: false,
    }

    mockedFusionService.getQuote.mockResolvedValueOnce(mockQuote)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/quote?src=0x1&dst=0x2&amount=1000&from=0x123'
      // No chainId provided
    )

    const response = await GET(request)

    expect(mockedFusionService.getQuote).toHaveBeenCalledWith({
      fromTokenAddress: '0x1',
      toTokenAddress: '0x2',
      amount: '1000',
      walletAddress: '0x123',
      srcChainId: 1, // Should default to 1
      dstChainId: undefined,
    })
  })
})