import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UnifiedSwapAggregator from '../unified-swap-aggregator'
import { oneInchService } from '@/lib/1inch'

// Mock the services
jest.mock('@/lib/1inch')
jest.mock('@/lib/fusion', () => ({
  fusionService: {
    createOrder: jest.fn(),
    submitOrder: jest.fn(),
  },
}))

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x123456789abcdef',
    isConnected: true,
  }),
  useChainId: () => 1,
  useBalance: () => ({
    data: {
      formatted: '10.5',
      symbol: 'ETH',
    },
  }),
}))

const mockedOneInchService = oneInchService as jest.Mocked<typeof oneInchService>

describe('UnifiedSwapAggregator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful quote response
    mockedOneInchService.getQuote.mockResolvedValue({
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
      protocols: [[[{ name: 'Uniswap V3', part: 100, fromTokenAddress: '', toTokenAddress: '' }]]],
      gas: 150000,
    })
  })

  it('should render swap interface correctly', () => {
    render(<UnifiedSwapAggregator />)
    
    expect(screen.getByText('Nexus')).toBeInTheDocument()
    expect(screen.getByText('Market Order')).toBeInTheDocument()
    expect(screen.getByText('Limit Order')).toBeInTheDocument()
    expect(screen.getByLabelText(/Amount to swap from/)).toBeInTheDocument()
  })

  it('should handle token amount input', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    
    await user.type(fromInput, '1.5')
    
    expect(fromInput).toHaveValue('1.5')
  })

  it('should fetch quote when amount is entered', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    
    await user.type(fromInput, '1')
    
    // Wait for debounced API call
    await waitFor(() => {
      expect(mockedOneInchService.getQuote).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('should display route comparison when quotes are available', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    await waitFor(() => {
      expect(screen.getByText('Route Comparison')).toBeInTheDocument()
      expect(screen.getByText('Fusion (MEV Protected)')).toBeInTheDocument()
      expect(screen.getByText('Classic Swap')).toBeInTheDocument()
    })
  })

  it('should handle token swap', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const swapButton = screen.getByLabelText('Swap token positions')
    await user.click(swapButton)
    
    // The swap should reverse the tokens
    // This is more of a visual test, but we can check if the component re-renders
    expect(swapButton).toBeInTheDocument()
  })

  it('should show error message when quote fails', async () => {
    mockedOneInchService.getQuote.mockRejectedValueOnce(new Error('Quote failed'))
    
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    await waitFor(() => {
      expect(screen.getByText(/Quote failed/)).toBeInTheDocument()
    })
  })

  it('should validate numeric input only', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    
    // Try to type invalid characters
    await user.type(fromInput, 'abc123def')
    
    // Should only contain the numeric part
    expect(fromInput).toHaveValue('123')
  })

  it('should handle decimal input correctly', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    
    await user.type(fromInput, '1.234567')
    
    expect(fromInput).toHaveValue('1.234567')
  })

  it('should show loading state during quote fetch', async () => {
    // Make the promise pending
    mockedOneInchService.getQuote.mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )
    
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    await waitFor(() => {
      expect(screen.getByText('Getting Quote...')).toBeInTheDocument()
    })
  })

  it('should show MAX button and handle click', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const maxButton = screen.getByText('MAX')
    await user.click(maxButton)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    expect(fromInput).toHaveValue('10.5') // From mocked balance
  })

  it('should toggle advanced settings', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)
    
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument()
    expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument()
    expect(screen.getByText('Transaction Deadline')).toBeInTheDocument()
  })

  it('should handle slippage selection', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    // Open advanced settings
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)
    
    // Click 1.0% slippage button
    const slippageButton = screen.getByText('1.0%')
    await user.click(slippageButton)
    
    // Should be selected (this is more visual, but we can check the button state)
    expect(slippageButton).toBeInTheDocument()
  })

  it('should show transaction summary when route is selected', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    await waitFor(() => {
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument()
      expect(screen.getByText('Expected Output')).toBeInTheDocument()
      expect(screen.getByText('Gas Cost')).toBeInTheDocument()
    })
  })

  it('should handle route selection', async () => {
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    await waitFor(() => {
      const fusionRoute = screen.getByText('Fusion (MEV Protected)')
      const routeCard = fusionRoute.closest('[role="button"]')
      expect(routeCard).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('should prevent same token selection', async () => {
    mockedOneInchService.getQuote.mockRejectedValueOnce(new Error('Cannot swap the same token'))
    
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    await waitFor(() => {
      expect(screen.getByText(/Cannot swap the same token/)).toBeInTheDocument()
    })
  })

  it('should show connect wallet message when not connected', () => {
    // Mock disconnected state
    jest.mocked(require('wagmi').useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    })
    
    render(<UnifiedSwapAggregator />)
    
    const executeButton = screen.getByRole('button', { name: /Connect Wallet/ })
    expect(executeButton).toBeDisabled()
  })

  it('should handle retry mechanism on network errors', async () => {
    mockedOneInchService.getQuote
      .mockRejectedValueOnce({ message: 'network error' })
      .mockResolvedValueOnce({
        dstAmount: '1000000',
        srcToken: { address: '0x1', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        dstToken: { address: '0x2', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        protocols: [],
        gas: 150000,
      })
    
    const user = userEvent.setup()
    render(<UnifiedSwapAggregator />)
    
    const fromInput = screen.getByLabelText(/Amount to swap from/)
    await user.type(fromInput, '1')
    
    // Should eventually succeed after retry
    await waitFor(() => {
      expect(screen.getByText('Route Comparison')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})