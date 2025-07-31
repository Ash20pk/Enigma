import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
})

export const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  137: { name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  42161: { name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0' },
  10: { name: 'Optimism', symbol: 'OP', color: '#FF0420' },
  8453: { name: 'Base', symbol: 'BASE', color: '#0052FF' },
}

export const NATIVE_TOKENS = {
  1: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  137: '0x0000000000000000000000000000000000001010',
  42161: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  10: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  8453: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
}

export const POPULAR_TOKENS = {
  1: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xA0b86a33E6441e6C673c1B8B5Ef4b4B7B8B8B8B8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  ],
  137: [
    { address: '0x0000000000000000000000000000000000001010', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ethereum', decimals: 18 },
  ],
}
