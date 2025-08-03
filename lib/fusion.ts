import { FusionSDK, NetworkEnum, PrivateKeyProviderConnector, Web3Like } from '@1inch/fusion-sdk';
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
  private static instance: FusionService;
  private sdkInstances: Map<number, FusionSDK> = new Map();
  private readonly apiKey: string;
  
  // Store original orders to avoid serialization issues
  private static orderCache: Map<string, any> = new Map();
  
  // Store order creation parameters for re-creation if needed
  private static orderParamsCache: Map<string, FusionOrderParams> = new Map();

  // Singleton pattern to ensure cache is shared across all instances
  static getInstance(): FusionService {
    if (!FusionService.instance) {
      FusionService.instance = new FusionService();
    }
    return FusionService.instance;
  }
  
  // WETH addresses for different chains
  private readonly WETH_ADDRESSES: Record<number, string> = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum
    56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // BSC (WBNB)
    137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // Polygon (WMATIC)
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum (WETH)
    10: '0x4200000000000000000000000000000000000006', // Optimism (WETH)
    8453: '0x4200000000000000000000000000000000000006', // Base (WETH)
  };
  
  // Native token address constant
  private readonly NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

  private constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || '';
    if (!this.apiKey) {
      console.warn('1inch API key not found. Some Fusion features may not work properly.');
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
    
    // Create ethers provider
    const ethersRpcProvider = new JsonRpcProvider(rpcUrl);
    
    // Create Web3Like connector following official pattern
    const ethersProviderConnector: Web3Like = {
      eth: {
        call(transactionConfig: any): Promise<string> {
          return ethersRpcProvider.call(transactionConfig);
        },
      },
      extend(): void {},
    };

    // Create blockchain provider with dummy key for quotes
    const blockchainProvider = new PrivateKeyProviderConnector(
      '0x0000000000000000000000000000000000000000000000000000000000000001', // Dummy key for quotes
      ethersProviderConnector
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
  
  // Helper method to convert native token to wrapped token for Fusion
  private convertToWrappedToken(tokenAddress: string, chainId: number): string {
    if (tokenAddress.toLowerCase() === this.NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      const wethAddress = this.WETH_ADDRESSES[chainId];
      if (!wethAddress) {
        throw new Error(`WETH address not found for chain ID: ${chainId}`);
      }
      console.log(`Converting native token to WETH: ${tokenAddress} -> ${wethAddress}`);
      return wethAddress;
    }
    return tokenAddress;
  }

  async getQuote(params: FusionQuoteParams): Promise<FusionQuoteResponse> {
    try {
      const chainId = params.srcChainId || 1;
      
      // Check if API key is available
      if (!this.apiKey) {
        throw new Error('1inch API key is required for Fusion quotes. Please set ONEINCH_API_KEY in your environment variables.');
      }
      
      const sdk = this.getSDK(chainId);
      
      // Check if this is a cross-chain swap
      const isCrossChain = params.dstChainId && params.dstChainId !== chainId;
      
      if (isCrossChain) {
        // For cross-chain, we would need to handle differently
        // For now, throw an error as cross-chain might need special handling
        throw new Error('Cross-chain swaps require special implementation');
      }

      // Convert native tokens to wrapped tokens for Fusion compatibility
      const fromTokenAddress = this.convertToWrappedToken(params.fromTokenAddress, chainId);
      const toTokenAddress = this.convertToWrappedToken(params.toTokenAddress, chainId);
      
      console.log('Getting Fusion quote with params:', {
        originalFrom: params.fromTokenAddress,
        originalTo: params.toTokenAddress,
        fromTokenAddress,
        toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        chainId
      });

      const quote = await sdk.getQuote({
        fromTokenAddress,
        toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        source: 'nexus-dapp', // Add source identifier
      });

      console.log('Fusion quote response:', quote);

      // Extract destination amount from recommended preset
      const recommendedPreset = quote.presets[quote.recommendedPreset];
      const dstAmount = recommendedPreset?.auctionStartAmount?.toString() || '0';
      
      console.log('Fusion quote response:', {
        recommendedPreset: quote.recommendedPreset,
        preset: recommendedPreset,
        dstAmount,
        fromTokenAddress,
        toTokenAddress
      });

      // Since Fusion SDK doesn't provide token metadata in quote response,
      // we'll create minimal token objects with the addresses we know
      // Also convert BigInt values to strings for JSON serialization
      const serializablePresets: any = {};
      for (const [key, preset] of Object.entries(quote.presets)) {
        if (preset) {
          serializablePresets[key] = {
            auctionDuration: preset.auctionDuration?.toString(),
            startAuctionIn: preset.startAuctionIn?.toString(),
            bankFee: preset.bankFee?.toString(),
            initialRateBump: preset.initialRateBump,
            auctionStartAmount: preset.auctionStartAmount?.toString(),
            auctionEndAmount: preset.auctionEndAmount?.toString(),
            tokenFee: preset.tokenFee?.toString(),
            allowPartialFills: preset.allowPartialFills,
            allowMultipleFills: preset.allowMultipleFills,
          };
        }
      }
      
      return {
        dstAmount,
        srcToken: {
          address: fromTokenAddress,
          symbol: fromTokenAddress === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' ? 'WETH' : 'TOKEN',
          name: fromTokenAddress === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' ? 'Wrapped Ether' : 'Token',
          decimals: 18, // Default to 18, should be fetched from token contract in production
        },
        dstToken: {
          address: toTokenAddress,
          symbol: toTokenAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' ? 'USDC' : 'TOKEN',
          name: toTokenAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' ? 'USD Coin' : 'Token',
          decimals: toTokenAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' ? 6 : 18,
        },
        presets: serializablePresets,
        recommendedPreset: quote.recommendedPreset,
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

      // Convert native tokens to wrapped tokens for Fusion compatibility
      const fromTokenAddress = this.convertToWrappedToken(params.fromTokenAddress, chainId);
      const toTokenAddress = this.convertToWrappedToken(params.toTokenAddress, chainId);
      
      console.log('Creating Fusion order with params:', {
        originalFrom: params.fromTokenAddress,
        originalTo: params.toTokenAddress,
        fromTokenAddress,
        toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        chainId
      });

      // Create the order (this returns PreparedOrder with FusionOrder object)
      const preparedOrder = await sdk.createOrder({
        fromTokenAddress,
        toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        receiver: params.receiver,
        permit: params.permit,
        source: 'nexus-dapp',
      });

      console.log('Fusion order created (PreparedOrder):', {
        hasOrder: !!preparedOrder.order,
        orderType: preparedOrder.order?.constructor?.name,
        hash: preparedOrder.hash,
        quoteId: preparedOrder.quoteId
      });

      // Cache the original FusionOrder object (not the PreparedOrder)
      FusionService.orderCache.set(preparedOrder.quoteId, preparedOrder.order);
      console.log('Cached original FusionOrder for quoteId:', preparedOrder.quoteId);
      
      // Also cache the parameters for potential order re-creation
      FusionService.orderParamsCache.set(preparedOrder.quoteId, params);
      console.log('Cached order parameters for potential re-creation');

      return {
        orderHash: preparedOrder.hash, // Use the hash from PreparedOrder
        order: preparedOrder.order,    // This is the FusionOrder object
        quoteId: preparedOrder.quoteId,
      };
    } catch (error: unknown) {
      console.error('Error creating Fusion order:', error);
      throw new Error(`Failed to create Fusion order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitOrder(order: any, quoteId: string, chainId: number = 1): Promise<{ orderHash: string }> {
    try {
      const sdk = this.getSDK(chainId);
      
      console.log('Submitting Fusion order:', { quoteId, chainId });
      
      const info = await sdk.submitOrder(order, quoteId);
      
      console.log('Fusion order submitted:', info);
      
      return {
        orderHash: info.orderHash
      };
    } catch (error: any) {
      console.error('Error submitting Fusion order:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to submit Fusion order: ${errorMessage}`);
    }
  }

  async submitSignedOrder(order: any, signature: string, quoteId: string, chainId: number = 1): Promise<{ orderHash: string }> {
    try {
      const sdk = this.getSDK(chainId);
      
      console.log('🚀 Submitting signed Fusion order:', { 
        quoteId, 
        chainId, 
        hasSignature: !!signature,
        orderType: typeof order,
        orderStructure: Object.keys(order)
      });
      
      console.log('🔐 Order signature:', signature.slice(0, 10) + '...');
      
      // NEW APPROACH: Always try to recreate the order fresh if we have params
      // This ensures we have a clean SDK order object
      let orderToSubmit = order;
      let orderSource = 'serialized';
      
      if (FusionService.orderParamsCache.has(quoteId)) {
        console.log('🔄 Recreating fresh order from cached parameters for clean submission');
        const params = FusionService.orderParamsCache.get(quoteId)!;
        
        try {
          // Recreate the order fresh from the SDK - this guarantees proper FusionOrder structure
          const freshOrderResponse = await this.createOrder(params);
          orderToSubmit = freshOrderResponse.order; // This is a proper FusionOrder object
          orderSource = 'fresh_recreation';
          console.log('✅ Successfully recreated fresh FusionOrder with proper SDK structure');
          // Clean up caches
          FusionService.orderParamsCache.delete(quoteId);
          FusionService.orderCache.delete(quoteId);
        } catch (recreateError) {
          console.error('❌ Failed to recreate order:', recreateError);
          // Fall back to cached order if available
          if (FusionService.orderCache.has(quoteId)) {
            console.log('🔄 Falling back to cached original FusionOrder');
            orderToSubmit = FusionService.orderCache.get(quoteId); // This should be a FusionOrder
            orderSource = 'cached_original';
            FusionService.orderCache.delete(quoteId);
          } else {
            console.log('⚠️ No cached FusionOrder available, cannot reconstruct - this will likely fail');
            throw new Error('No valid FusionOrder available. Cannot reconstruct FusionOrder from serialized data.');
          }
        }
      } else if (FusionService.orderCache.has(quoteId)) {
        console.log('✅ Using cached original FusionOrder for submission');
        orderToSubmit = FusionService.orderCache.get(quoteId); // This should be a FusionOrder
        orderSource = 'cached_original';
        FusionService.orderCache.delete(quoteId);
      } else {
        console.log('❌ No cached FusionOrder or params found - cannot proceed');
        console.log('🔍 Available cache keys:', {
          orderCacheKeys: Array.from(FusionService.orderCache.keys()),
          paramsCacheKeys: Array.from(FusionService.orderParamsCache.keys()),
          requestedQuoteId: quoteId
        });
        throw new Error('No cached FusionOrder available for submission. FusionOrder objects cannot be reconstructed from JSON.');
      }
      
      console.log('🔍 Final FusionOrder validation before submission:', {
        source: orderSource,
        type: typeof orderToSubmit,
        constructorName: orderToSubmit?.constructor?.name,
        isFusionOrder: orderToSubmit?.constructor?.name === 'FusionOrder',
        hasInner: !!orderToSubmit?.inner,
        hasOrderStruct: !!orderToSubmit?.orderStruct,
        hasExtension: !!orderToSubmit?.extension,
        isPlainObject: orderToSubmit?.constructor === Object
      });
      
      // Enhanced validation - ensure this is a proper FusionOrder object
      if (!orderToSubmit || typeof orderToSubmit !== 'object') {
        throw new Error('Order is not a valid object');
      }
      
      // Check if this is actually a FusionOrder instance
      if (orderToSubmit.constructor?.name !== 'FusionOrder') {
        console.error('❌ Order is not a FusionOrder instance:', orderToSubmit.constructor?.name);
        throw new Error(`Expected FusionOrder instance, got ${orderToSubmit.constructor?.name || typeof orderToSubmit}`);
      }
      
      // Validate FusionOrder has required methods (based on actual FusionOrder class)
      const hasRequiredMethods = typeof orderToSubmit.build === 'function' && 
                                typeof orderToSubmit.getOrderHash === 'function' &&
                                typeof orderToSubmit.getTypedData === 'function';
      
      if (!hasRequiredMethods) {
        console.error('❌ FusionOrder missing required methods');
        console.error('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(orderToSubmit)));
        throw new Error('Invalid FusionOrder: missing required methods (build, getOrderHash, getTypedData)');
      }
      
      console.log('✅ FusionOrder validation passed - submitting to SDK');
      
      // According to SDK types: submitOrder(order: FusionOrder, quoteId: string)
      console.log('📤 Submitting FusionOrder to SDK using sdk.submitOrder(fusionOrder, quoteId)...');
      const info = await sdk.submitOrder(orderToSubmit, quoteId);
      
      console.log('🎉 Signed Fusion order submitted successfully:', info);
      
      return {
        orderHash: info.orderHash
      };
    } catch (error: any) {
      console.error('❌ Error submitting signed Fusion order:', error);
      console.error('🔍 Full error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.slice(0, 200),
        response: error.response?.data
      });
      
      // Enhanced error detection and handling for FusionOrder issues
      if (error.message?.includes('build is not a function')) {
        console.error('🚫 FusionOrder method access error');
        console.error('📋 Order type:', typeof order);
        console.error('📋 Order constructor:', order?.constructor?.name);
        throw new Error('FusionOrder method access error. The object is not a valid FusionOrder instance.');
      }
      
      if (error.message?.includes('Cannot read properties') && error.message?.includes('build')) {
        throw new Error('FusionOrder object corruption. The order is not a valid FusionOrder instance.');
      }
      
      if (error.message?.includes('submitOrder')) {
        throw new Error(`Fusion SDK submitOrder failed: ${error.message}`);
      }
      
      if (error.message?.includes('Expected FusionOrder instance')) {
        throw new Error('Type validation failed: ' + error.message);
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to submit signed Fusion order: ${errorMessage}`);
    }
  }

  // Note: FusionOrder objects cannot be reconstructed from JSON serialization
  // because they are class instances with methods and internal state.
  // We must always use cached FusionOrder instances or recreate them via SDK.

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

export const fusionService = FusionService.getInstance();