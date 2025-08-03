import axios from 'axios';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  eip2612?: boolean;
  isFoT?: boolean;
  tags?: string[];
}

export interface Protocol {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface QuoteResponse {
  dstAmount: string;
  srcToken: Token;
  dstToken: Token;
  protocols: Protocol[][][];
  gas: number;
}

export interface SwapResponse extends QuoteResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
}

export interface PortfolioToken {
  token_address: string;
  symbol: string;
  name: string;
  logo: string;
  thumbnail: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
  balance_formatted: string;
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_price_24hr_usd_change: number;
  usd_value: number;
  usd_value_24hr_usd_change: number;
  native_token: boolean;
  portfolio_percentage: number;
}

class OneInchService {
  private baseURL = '/api/1inch';
  private requestTimeout = 10000; // 10 seconds
  
  private async makeRequest(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          timeout: this.requestTimeout,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return response.data;
      } catch (error: any) {
        if (i === retries - 1) throw error;
        
        // Retry on network errors or 5xx status codes
        if (error.code === 'ECONNABORTED' || 
            (error.response && error.response.status >= 500)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
  }

  async getTokens(chainId: number = 1): Promise<{ [address: string]: Token }> {
    try {
      return await this.makeRequest(`${this.baseURL}/tokens?chainId=${chainId}`);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw new Error('Failed to fetch available tokens. Please try again.');
    }
  }

  async getQuote(
    chainId: number,
    src: string,
    dst: string,
    amount: string
  ): Promise<QuoteResponse> {
    try {
      return await this.makeRequest(
        `${this.baseURL}/quote?chainId=${chainId}&src=${src}&dst=${dst}&amount=${amount}`
      );
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error('Unable to get swap quote. Please check your token selection and amount.');
    }
  }

  async getSwap(
    chainId: number,
    src: string,
    dst: string,
    amount: string,
    from: string,
    slippage: number = 1
  ): Promise<SwapResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/swap?chainId=${chainId}&src=${src}&dst=${dst}&amount=${amount}&from=${from}&slippage=${slippage}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching swap:', error);
      throw error;
    }
  }

  async executeSwap(
    chainId: number,
    src: string,
    dst: string,
    amount: string,
    from: string,
    slippage: number = 1
  ): Promise<SwapResponse> {
    try {
      return await this.makeRequest(
        `${this.baseURL}/swap?chainId=${chainId}&src=${src}&dst=${dst}&amount=${amount}&from=${from}&slippage=${slippage}`
      );
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error('Failed to execute swap. Please try again.');
    }
  }

  async getAllowance(
    chainId: number,
    tokenAddress: string,
    walletAddress: string
  ): Promise<{ allowance: string }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/allowance?chainId=${chainId}&tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching allowance:', error);
      throw error;
    }
  }

  async getApproveTransaction(
    chainId: number,
    tokenAddress: string,
    amount?: string
  ): Promise<{ data: string; gasPrice: string; to: string; value: string }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/approve?chainId=${chainId}&tokenAddress=${tokenAddress}${
          amount ? `&amount=${amount}` : ''
        }`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching approve transaction:', error);
      throw error;
    }
  }

  async getPortfolio(addresses: string[]): Promise<PortfolioToken[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/portfolio?addresses=${addresses.join(',')}`
      );
      return response.data.result || [];
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async getPrices(
    chainId: number,
    addresses: string[],
    currency: string = 'USD'
  ): Promise<{ [address: string]: number }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/prices?chainId=${chainId}&addresses=${addresses.join(',')}&currency=${currency}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }

  // Fusion (Intent-based) APIs
  async getFusionQuote(
    chainId: number,
    src: string,
    dst: string,
    amount: string,
    from: string
  ): Promise<any> {
    try {
      return await this.makeRequest(
        `${this.baseURL}/fusion/quote?chainId=${chainId}&src=${src}&dst=${dst}&amount=${amount}&from=${from}`
      );
    } catch (error) {
      console.error('Error fetching Fusion quote:', error);
      throw new Error('Unable to get Fusion quote. Please check your parameters.');
    }
  }

  async submitFusionOrder(
    chainId: number,
    orderData: {
      src: string;
      dst: string;
      amount: string;
      from: string;
      receiver?: string;
      preset?: string;
      source?: string;
      permit?: string;
      interactions?: any;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/fusion/swap`,
        { chainId, ...orderData },
        {
          timeout: this.requestTimeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting Fusion order:', error);
      throw new Error('Failed to submit Fusion order. Please try again.');
    }
  }

  // Cross-chain functionality now available through Fusion SDK
  // Use fusionService from @/lib/fusion for cross-chain operations
  async getCrossChainQuote(
    srcChainId: number,
    dstChainId: number,
    src: string,
    dst: string,
    amount: string,
    from: string
  ): Promise<any> {
    // Redirect to fusion service for cross-chain operations
    const { fusionService } = await import('./fusion');
    return await fusionService.getQuote({
      fromTokenAddress: src,
      toTokenAddress: dst,
      amount,
      walletAddress: from,
      srcChainId,
      dstChainId,
    });
  }

  async submitCrossChainOrder(
    orderData: {
      srcChainId: number;
      dstChainId: number;
      src: string;
      dst: string;
      amount: string;
      from: string;
      receiver?: string;
      permit?: string;
    }
  ): Promise<any> {
    // Redirect to fusion service for cross-chain operations
    const { fusionService } = await import('./fusion');
    return await fusionService.createOrder({
      fromTokenAddress: orderData.src,
      toTokenAddress: orderData.dst,
      amount: orderData.amount,
      walletAddress: orderData.from,
      receiver: orderData.receiver,
      permit: orderData.permit,
      srcChainId: orderData.srcChainId,
      dstChainId: orderData.dstChainId,
    });
  }

  // Limit Order Protocol APIs
  async createLimitOrder(
    chainId: number,
    orderData: {
      makerAsset: string;
      takerAsset: string;
      makingAmount: string;
      takingAmount: string;
      maker: string;
      receiver?: string;
      allowedSender?: string;
      predicate?: string;
      permit?: string;
      interactions?: any;
      salt?: string;
      extension?: string;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/limit-order/create`,
        { chainId, ...orderData },
        {
          timeout: this.requestTimeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating limit order:', error);
      throw new Error('Failed to create limit order. Please try again.');
    }
  }

  async getLimitOrders(
    chainId: number,
    filters: {
      page?: number;
      limit?: number;
      statuses?: string;
      makerAsset?: string;
      takerAsset?: string;
      maker?: string;
      taker?: string;
    } = {}
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        page: (filters.page || 1).toString(),
        limit: (filters.limit || 100).toString(),
        ...(filters.statuses && { statuses: filters.statuses }),
        ...(filters.makerAsset && { makerAsset: filters.makerAsset }),
        ...(filters.takerAsset && { takerAsset: filters.takerAsset }),
        ...(filters.maker && { maker: filters.maker }),
        ...(filters.taker && { taker: filters.taker }),
      });

      return await this.makeRequest(
        `${this.baseURL}/limit-order/orders?${params}`
      );
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      throw new Error('Failed to fetch limit orders. Please try again.');
    }
  }

  formatAmount(amount: string, decimals: number): string {
    // Convert decimal amount to BigInt-compatible string
    const [whole, decimal = ''] = amount.split('.');
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
    const fullAmountString = whole + paddedDecimal;
    return BigInt(fullAmountString).toString();
  }

  parseAmount(amount: string, decimals: number): string {
    return (BigInt(amount) / BigInt(10 ** decimals)).toString();
  }
}

export const oneInchService = new OneInchService();
