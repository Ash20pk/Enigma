import { POST } from '../fusion/swap/route'
import { NextRequest } from 'next/server'
import { fusionService } from '@/lib/fusion'

// Mock the fusion service
jest.mock('@/lib/fusion', () => ({
  fusionService: {
    createOrder: jest.fn(),
    submitOrder: jest.fn(),
  },
}))

const mockedFusionService = fusionService as jest.Mocked<typeof fusionService>

describe('/api/1inch/fusion/swap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create and submit fusion order successfully', async () => {
    const mockOrderResponse = {
      orderHash: '',
      order: { id: 'order-123', data: 'order-data' },
      quoteId: 'quote-456',
    }

    const mockOrderHash = '0xabcd1234567890'

    mockedFusionService.createOrder.mockResolvedValueOnce(mockOrderResponse)
    mockedFusionService.submitOrder.mockResolvedValueOnce(mockOrderHash)

    const requestBody = {
      chainId: 1,
      src: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      dst: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
      amount: '1000000000000000000',
      from: '0x123456789',
      receiver: '0x987654321',
      permit: 'permit-data',
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      orderHash: mockOrderHash,
      order: mockOrderResponse.order,
      quoteId: mockOrderResponse.quoteId,
    })

    expect(mockedFusionService.createOrder).toHaveBeenCalledWith({
      fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      toTokenAddress: '0xA0b86991c6218a36c1d19D4a2e9Eb0cE3606eB48',
      amount: '1000000000000000000',
      walletAddress: '0x123456789',
      receiver: '0x987654321',
      permit: 'permit-data',
      srcChainId: 1,
      dstChainId: undefined,
    })

    expect(mockedFusionService.submitOrder).toHaveBeenCalledWith(
      mockOrderResponse.order,
      mockOrderResponse.quoteId,
      1
    )
  })

  it('should handle cross-chain swap parameters', async () => {
    const mockOrderResponse = {
      orderHash: '',
      order: { id: 'order-456' },
      quoteId: 'quote-789',
    }

    mockedFusionService.createOrder.mockResolvedValueOnce(mockOrderResponse)
    mockedFusionService.submitOrder.mockResolvedValueOnce('0xhash')

    const requestBody = {
      chainId: 1,
      src: '0x1',
      dst: '0x2',
      amount: '1000',
      from: '0x123',
      dstChainId: 137, // Cross-chain to Polygon
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)

    expect(mockedFusionService.createOrder).toHaveBeenCalledWith({
      fromTokenAddress: '0x1',
      toTokenAddress: '0x2',
      amount: '1000',
      walletAddress: '0x123',
      receiver: '0x123', // Should default to from address
      permit: undefined,
      srcChainId: 1,
      dstChainId: 137,
    })
  })

  it('should return 400 for missing required parameters', async () => {
    const requestBody = {
      chainId: 1,
      src: '0x1',
      // Missing dst, amount, from
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameters: src, dst, amount, from')
  })

  it('should handle order creation errors', async () => {
    mockedFusionService.createOrder.mockRejectedValueOnce(new Error('Order creation failed'))

    const requestBody = {
      chainId: 1,
      src: '0x1',
      dst: '0x2',
      amount: '1000',
      from: '0x123',
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Order creation failed')
  })

  it('should handle order submission errors', async () => {
    const mockOrderResponse = {
      orderHash: '',
      order: { id: 'order-123' },
      quoteId: 'quote-456',
    }

    mockedFusionService.createOrder.mockResolvedValueOnce(mockOrderResponse)
    mockedFusionService.submitOrder.mockRejectedValueOnce(new Error('Submission failed'))

    const requestBody = {
      chainId: 1,
      src: '0x1',
      dst: '0x2',
      amount: '1000',
      from: '0x123',
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Submission failed')
  })

  it('should handle unknown errors', async () => {
    mockedFusionService.createOrder.mockRejectedValueOnce('Unknown error')

    const requestBody = {
      chainId: 1,
      src: '0x1',
      dst: '0x2',
      amount: '1000',
      from: '0x123',
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to submit Fusion order')
  })

  it('should use default chainId when not provided', async () => {
    const mockOrderResponse = {
      orderHash: '',
      order: { id: 'order-123' },
      quoteId: 'quote-456',
    }

    mockedFusionService.createOrder.mockResolvedValueOnce(mockOrderResponse)
    mockedFusionService.submitOrder.mockResolvedValueOnce('0xhash')

    const requestBody = {
      // No chainId provided
      src: '0x1',
      dst: '0x2',
      amount: '1000',
      from: '0x123',
    }

    const request = new NextRequest('http://localhost:3000/api/1inch/fusion/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)

    expect(mockedFusionService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainId: 1, // Should default to 1
      })
    )

    expect(mockedFusionService.submitOrder).toHaveBeenCalledWith(
      mockOrderResponse.order,
      mockOrderResponse.quoteId,
      1 // Should default to 1
    )
  })
})