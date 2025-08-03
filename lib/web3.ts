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
  1: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  137: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  42161: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  10: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  8453: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
}

export const POPULAR_TOKENS = {
  1: [
    { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  ],
  137: [
    { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ethereum', decimals: 18 },
  ],
  42161: [
    { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
  ],
  10: [
    { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18 },
  ],
  8453: [
    { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', symbol: 'DEGEN', name: 'Degen', decimals: 18 },
  ],
}
