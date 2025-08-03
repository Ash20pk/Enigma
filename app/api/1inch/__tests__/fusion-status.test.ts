import { GET } from '../fusion/status/route'
import { NextRequest } from 'next/server'
import { fusionService } from '@/lib/fusion'

// Mock the fusion service
jest.mock('@/lib/fusion', () => ({
  fusionService: {
    getOrderStatus: jest.fn(),
  },
}))

const mockedFusionService = fusionService as jest.Mocked<typeof fusionService>

describe('/api/1inch/fusion/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return order status for valid parameters', async () => {
    const mockStatus = {
      status: 'filled',
      txHash: '0x123456789abcdef',
      fills: [
        {
          txHash: '0x123456789abcdef',
          amount: '1000000',
        },
      ],
    }

    mockedFusionService.getOrderStatus.mockResolvedValueOnce(mockStatus)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?orderHash=0xabcd1234&chainId=1'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockStatus)
    expect(mockedFusionService.getOrderStatus).toHaveBeenCalledWith('0xabcd1234', 1)
  })

  it('should use default chainId when not provided', async () => {
    const mockStatus = {
      status: 'pending',
    }

    mockedFusionService.getOrderStatus.mockResolvedValueOnce(mockStatus)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?orderHash=0xabcd1234'
      // No chainId provided
    )

    const response = await GET(request)

    expect(mockedFusionService.getOrderStatus).toHaveBeenCalledWith('0xabcd1234', 1)
  })

  it('should return 400 for missing orderHash parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?chainId=1'
      // Missing orderHash
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameter: orderHash')
  })

  it('should handle fusion service errors', async () => {
    mockedFusionService.getOrderStatus.mockRejectedValueOnce(new Error('Status fetch failed'))

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?orderHash=0xabcd1234&chainId=1'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Status fetch failed')
  })

  it('should handle unknown errors', async () => {
    mockedFusionService.getOrderStatus.mockRejectedValueOnce('Unknown error')

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?orderHash=0xabcd1234&chainId=1'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch order status')
  })

  it('should handle different chain IDs', async () => {
    const mockStatus = {
      status: 'cancelled',
    }

    mockedFusionService.getOrderStatus.mockResolvedValueOnce(mockStatus)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?orderHash=0xabcd1234&chainId=137'
    )

    const response = await GET(request)

    expect(mockedFusionService.getOrderStatus).toHaveBeenCalledWith('0xabcd1234', 137)
  })

  it('should handle expired orders', async () => {
    const mockStatus = {
      status: 'expired',
      expirationTime: 1234567890,
    }

    mockedFusionService.getOrderStatus.mockResolvedValueOnce(mockStatus)

    const request = new NextRequest(
      'http://localhost:3000/api/1inch/fusion/status?orderHash=0xexpired123&chainId=1'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockStatus)
  })
})