import { GET } from '../quote/route'
import { NextRequest } from 'next/server'

// Mock fetch globally
global.fetch = jest.fn()

describe('/api/1inch/quote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ONEINCH_API_KEY = 'test-api-key'
  })

  it('should return quote for valid parameters', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/quote?chainId=1&src=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&dst=0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48&amount=1000000000000000000'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockQuote)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.1inch.dev/swap/v6.0/1/quote?src=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&dst=0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48&amount=1000000000000000000&includeTokensInfo=true&includeProtocols=true&includeGas=true',
      {
        headers: {
          'Authorization': 'Bearer test-api-key',
          'accept': 'application/json',
        },
      }
    )
  })

  it('should return 400 for missing parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/1inch/quote?chainId=1&src=0xtoken1'
      // Missing dst and amount
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameters: src, dst, amount')
  })

  it('should handle API errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/quote?chainId=1&src=0xtoken1&dst=0xtoken2&amount=1000'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch quote')
  })

  it('should use default chainId when not provided', async () => {
    const mockQuote = { dstAmount: '1000' }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuote,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/quote?src=0xtoken1&dst=0xtoken2&amount=1000'
      // No chainId provided
    )

    const response = await GET(request)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/swap/v6.0/1/quote'), // Should default to chainId 1
      expect.any(Object)
    )
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/quote?chainId=1&src=0xtoken1&dst=0xtoken2&amount=1000'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch quote')
  })
})