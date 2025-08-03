# 🚀 Nexus - The Ultimate DeFi Trading Platform

**The convergence point where all DeFi protocols, chains, and opportunities unite into one optimized experience.**

Nexus is a comprehensive DeFi trading platform that maximizes every aspect of the 1inch protocol suite, providing intelligent trade routing, cross-chain arbitrage, MEV protection, and advanced portfolio management.

## 🎯 Problem Solved

DeFi traders are fragmented across multiple platforms, protocols, and chains, leading to:
- **$2.1B in annual inefficient execution** costs
- **$500M+ lost to MEV** attacks
- **78% of traders** using suboptimal execution methods
- **Missed arbitrage opportunities** due to manual cross-chain execution

## ✨ Key Features

### 🧠 **Intelligent Trade Router**
- **AI-Powered Protocol Selection**: Automatically chooses between Classic, Fusion, Fusion+, and Limit Orders
- **Real-time Comparison**: Side-by-side analysis of all execution methods
- **MEV Protection by Default**: Routes through Fusion when MEV risk is detected
- **Gas Optimization**: Smart routing based on trade size and market conditions

### 🔄 **Cross-Chain Arbitrage Scanner**
- **Real-time Opportunity Detection**: Scans price differences across all 5 supported chains
- **One-Click Execution**: Execute arbitrage trades using Fusion+ (bridge-free)
- **Confidence Scoring**: AI-powered risk assessment for each opportunity
- **Auto-scanning**: Continuous monitoring with 30-second intervals

### 🛡️ **MEV Protection Dashboard**
- **Comprehensive Protection**: Sandwich attack, frontrunning, and backrunning prevention
- **Real-time Alerts**: Live monitoring of MEV attempts and blocks
- **Savings Tracking**: Track total USD saved from MEV protection
- **Private Mempool**: Transactions hidden from public mempool

### 📊 **Advanced Portfolio Management**
- **Multi-Chain Portfolio**: Unified view across all supported chains
- **Auto-Rebalancing**: Maintain target allocations using Fusion+
- **Limit Order Engine**: Set complex conditional orders across chains
- **P&L Analytics**: Detailed profit/loss tracking with protocol performance

## 🔧 Technical Architecture

### **Complete 1inch API Integration**
- ✅ **Classic Swap Protocol (v6.0)**: Quote, Swap, Tokens, Allowance, Approve
- ✅ **Fusion Protocol (v1.0)**: Intent-based swaps with MEV protection
- ✅ **Fusion+ Protocol (v1.0)**: Bridge-free cross-chain swaps
- ✅ **Limit Order Protocol (v4.0)**: Advanced order management
- ✅ **Portfolio API (v4.0)**: Multi-chain balance tracking
- ✅ **Price Feeds API**: Real-time token prices

### **Tech Stack**
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v3, shadcn/ui components, Glassmorphism design
- **Web3**: Wagmi, Viem for wallet connections and blockchain interactions
- **State Management**: TanStack Query for API state management
- **Charts**: Recharts for data visualization
- **API Layer**: Next.js API routes with Bearer token authentication
- **Real-time Quotes**: Live price updates and route optimization

### 📊 Portfolio Management
- **Real-time Portfolio Tracking**: Live balance and value updates
- **Performance Analytics**: 24h changes and historical data
- **Asset Allocation**: Visual portfolio distribution
- **Multi-token Support**: Track all ERC-20 tokens

### 🔗 Web3 Integration
- **Multiple Wallet Support**: MetaMask, WalletConnect, and more
- **Chain Switching**: Seamless network transitions
- **Transaction Management**: Approve and execute swaps
- **Security**: Non-custodial, self-custody trading

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Modern glassmorphism design
- **Real-time Updates**: Live data without page refresh
- **Intuitive Interface**: Clean and user-friendly

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Web3 wallet (MetaMask recommended)
- 1inch API key (get from [1inch Developer Portal](https://portal.1inch.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hackathon_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   ONEINCH_API_KEY=your_1inch_api_key_here
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### 1inch API Setup
1. Visit [1inch Developer Portal](https://portal.1inch.dev/)
2. Create an account and generate an API key
3. Add the API key to your `.env.local` file

### WalletConnect Setup (Optional)
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a project and get your Project ID
3. Add the Project ID to your `.env.local` file

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Web3**: Wagmi, Viem, Ethers.js
- **State Management**: TanStack Query
- **Charts**: Recharts
- **API**: 1inch API v6.0

### Project Structure
```
├── app/
│   ├── api/1inch/          # 1inch API routes
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── providers.tsx       # Web3 providers
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── portfolio-dashboard.tsx
│   ├── swap-interface.tsx
│   ├── token-selector.tsx
│   └── wallet-connect.tsx
├── lib/
│   ├── 1inch.ts           # 1inch service
│   ├── utils.ts           # Utility functions
│   └── web3.ts            # Web3 configuration
└── public/                # Static assets
```

## 🔌 API Integration

This dApp integrates multiple 1inch API endpoints:

- **Token API**: Fetch available tokens for each chain
- **Quote API**: Get swap quotes and rates
- **Swap API**: Execute token swaps
- **Allowance API**: Check token allowances
- **Approve API**: Generate approval transactions
- **Portfolio API**: Track wallet balances
- **Price API**: Get real-time token prices

## 🌐 Supported Networks

- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Adding New Features

1. **New API Endpoints**: Add routes in `app/api/1inch/`
2. **UI Components**: Create in `components/`
3. **Utility Functions**: Add to `lib/`
4. **Styling**: Use Tailwind CSS classes

## 🔒 Security

- **Non-custodial**: Users maintain control of their funds
- **API Key Security**: Server-side API calls only
- **Transaction Signing**: Client-side wallet signing
- **Input Validation**: Comprehensive parameter validation

## 📱 Mobile Support

- Fully responsive design
- Mobile wallet integration
- Touch-optimized interface
- Progressive Web App (PWA) ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [1inch Network](https://1inch.io/) for the powerful API
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Wagmi](https://wagmi.sh/) for Web3 React hooks
- [Next.js](https://nextjs.org/) for the amazing framework

## 📞 Support

For support and questions:
- Check the [1inch API Documentation](https://docs.1inch.io/)
- Open an issue on GitHub
- Join the community discussions

---

**Built with ❤️ for the DeFi community**
