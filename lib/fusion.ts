import { FusionSDK, NetworkEnum, PrivateKeyProviderConnector } from '@1inch/fusion-sdk';
import { JsonRpcProvider } from 'ethers';

export interface FusionQuoteParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  srcChainId?: number;
  dstChainId?: number;
}

export interface FusionOrderParams extends FusionQuoteParams {
  permit?: string;
  receiver?: string;
}

export interface FusionQuoteResponse {
  dstAmount: string;
  srcToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  dstToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  gas: number;
  quoteId: string;
  isCrossChain: boolean;
}

export interface FusionOrderResponse {
  orderHash: string;
  order: object;
  quoteId: string;
}

class FusionService {
  private sdkInstances: Map<number, FusionSDK> = new Map();
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || '';
    if (!this.apiKey) {
      console.warn('1inch API key not found. Fusion SDK will not work properly.');
    }
  }

  private getNetworkEnum(chainId: number): NetworkEnum {
    switch (chainId) {
      case 1:
        return NetworkEnum.ETHEREUM;
      case 56:
        return NetworkEnum.BINANCE;
      case 137:
        return NetworkEnum.POLYGON;
      case 42161:
        return NetworkEnum.ARBITRUM;
      case 10:
        return NetworkEnum.OPTIMISM;
      case 8453:
        return NetworkEnum.BASE;
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }

  private getRpcUrl(chainId: number): string {
    switch (chainId) {
      case 1:
        return 'https://eth.llamarpc.com';
      case 56:
        return 'https://bsc-dataseed.binance.org/';
      case 137:
        return 'https://polygon-rpc.com/';
      case 42161:
        return 'https://arb1.arbitrum.io/rpc';
      case 10:
        return 'https://mainnet.optimism.io';
      case 8453:
        return 'https://mainnet.base.org';
      default:
        throw new Error(`No RPC URL configured for chain ID: ${chainId}`);
    }
  }

  private getSDK(chainId: number): FusionSDK {
    if (this.sdkInstances.has(chainId)) {
      return this.sdkInstances.get(chainId)!;
    }

    const network = this.getNetworkEnum(chainId);
    const rpcUrl = this.getRpcUrl(chainId);
    
    // Create a provider - for quotes we don't need a private key
    const provider = new JsonRpcProvider(rpcUrl);
    const blockchainProvider = new PrivateKeyProviderConnector(
      '0x0000000000000000000000000000000000000000000000000000000000000001', // Dummy key for quotes
      provider
    );

    const sdk = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network,
      blockchainProvider,
      authKey: this.apiKey,
    });

    this.sdkInstances.set(chainId, sdk);
    return sdk;
  }

  async getQuote(params: FusionQuoteParams): Promise<FusionQuoteResponse> {
    try {
      const chainId = params.srcChainId || 1;
      const sdk = this.getSDK(chainId);
      
      // Check if this is a cross-chain swap
      const isCrossChain = params.dstChainId && params.dstChainId !== chainId;
      
      if (isCrossChain) {
        // For cross-chain, we would need to handle differently
        // For now, throw an error as cross-chain might need special handling
        throw new Error('Cross-chain swaps require special implementation');
      }

      const quote = await sdk.getQuote({
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
      });

      return {
        dstAmount: quote.dstAmount,
        srcToken: {
          address: quote.srcToken.address,
          symbol: quote.srcToken.symbol,
          name: quote.srcToken.name,
          decimals: quote.srcToken.decimals,
        },
        dstToken: {
          address: quote.dstToken.address,
          symbol: quote.dstToken.symbol,
          name: quote.dstToken.name,
          decimals: quote.dstToken.decimals,
        },
        gas: quote.gas || 0,
        quoteId: quote.quoteId,
        isCrossChain: false,
      };
    } catch (error: unknown) {
      console.error('Error getting Fusion quote:', error);
      throw new Error(`Failed to get Fusion quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createOrder(params: FusionOrderParams): Promise<FusionOrderResponse> {
    try {
      const chainId = params.srcChainId || 1;
      const sdk = this.getSDK(chainId);

      // First get a quote
      const quote = await this.getQuote(params);

      // Create the order
      const order = await sdk.createOrder({
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        receiver: params.receiver,
        permit: params.permit,
      });

      return {
        orderHash: '', // Will be set after submission
        order: order,
        quoteId: quote.quoteId,
      };
    } catch (error: unknown) {
      console.error('Error creating Fusion order:', error);
      throw new Error(`Failed to create Fusion order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitOrder(order: object, quoteId: string, chainId: number = 1): Promise<string> {
    try {
      const sdk = this.getSDK(chainId);
      
      const orderHash = await sdk.submitOrder(order, quoteId);
      return orderHash;
    } catch (error: unknown) {
      console.error('Error submitting Fusion order:', error);
      throw new Error(`Failed to submit Fusion order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOrderStatus(orderHash: string, chainId: number = 1) {
    try {
      const sdk = this.getSDK(chainId);
      
      const status = await sdk.getOrderStatus(orderHash);
      return status;
    } catch (error: unknown) {
      console.error('Error getting order status:', error);
      throw new Error(`Failed to get order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility method to check if cross-chain swap is supported
  isCrossChainSupported(srcChainId: number, dstChainId: number): boolean {
    const supportedChains = [1, 56, 137, 42161, 10, 8453];
    return supportedChains.includes(srcChainId) && supportedChains.includes(dstChainId);
  }

  // Get supported chains for Fusion
  getSupportedChains(): { chainId: number; name: string; network: NetworkEnum }[] {
    return [
      { chainId: 1, name: 'Ethereum', network: NetworkEnum.ETHEREUM },
      { chainId: 56, name: 'BSC', network: NetworkEnum.BINANCE },
      { chainId: 137, name: 'Polygon', network: NetworkEnum.POLYGON },
      { chainId: 42161, name: 'Arbitrum', network: NetworkEnum.ARBITRUM },
      { chainId: 10, name: 'Optimism', network: NetworkEnum.OPTIMISM },
      { chainId: 8453, name: 'Base', network: NetworkEnum.BASE },
    ];
  }
}

export const fusionService = new FusionService();