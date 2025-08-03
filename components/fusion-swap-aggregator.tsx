'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useChainId, useSignTypedData, useWalletClient } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownUp, Zap, Shield, Clock, TrendingUp, AlertCircle, RefreshCw, Info, Settings, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenSelector } from './token-selector';
import { signFusionOrder, prepareFusionOrderForSigning, submitSignedFusionOrder } from '@/lib/fusion-signing';

import { Token } from '@/lib/1inch';

interface FusionQuote {
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
  presets: any[];
  recommendedPreset: number;
}

export default function FusionSwapAggregator() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId() || 1;
  const { data: walletClient } = useWalletClient();
  const { signTypedDataAsync } = useSignTypedData();
  
  // State management
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fusionQuote, setFusionQuote] = useState<FusionQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Balance fetching
  const { data: fromTokenBalance } = useBalance({
    address: address,
    token: fromToken?.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' 
      ? undefined 
      : fromToken?.address as `0x${string}`,
    query: {
      enabled: isConnected && !!fromToken,
    },
  });

  const { data: toTokenBalance } = useBalance({
    address: address,
    token: toToken?.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' 
      ? undefined 
      : toToken?.address as `0x${string}`,
    query: {
      enabled: isConnected && !!toToken,
    },
  });

  // Enhanced balance formatting with better precision (memoized)
  const formatBalance = useCallback((balance: any, symbol: string) => {
    if (!balance) return '--';
    const value = parseFloat(balance.formatted);
    if (value === 0) return '0';
    if (value < 0.000001) return '<0.000001';
    if (value < 0.001) return value.toFixed(6);
    if (value < 0.1) return value.toFixed(4);
    if (value < 1) return value.toFixed(3);
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
    return `${(value / 1000000).toFixed(1)}M`;
  }, []);

  // Enhanced USD value formatting
  const formatUSDValue = useCallback((amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return '$0.00';
    if (value < 0.01) return '<$0.01';
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${(value / 1000000).toFixed(2)}M`;
  }, []);

  // Default tokens (ETH and USDC)
  useEffect(() => {
    if (!fromToken && !toToken) {
      setFromToken({
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
      });
      setToToken({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoURI: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png'
      });
    }
  }, []);

  // Fetch Fusion quote when inputs change
  useEffect(() => {
    const fetchFusionQuote = async () => {
      if (!fromAmount || !fromToken || !toToken || !isConnected || !address) {
        setFusionQuote(null);
        setToAmount('');
        return;
      }

      // Don't fetch quote for zero or invalid amounts
      const numericAmount = parseFloat(fromAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setFusionQuote(null);
        setToAmount('');
        return;
      }

      if (fromToken.address === toToken.address) {
        setError('Cannot swap the same token');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert amount to wei (considering token decimals)
        const amountInWei = (parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)).toString();
        
        // Get Fusion quote
        const response = await fetch('/api/1inch/fusion/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            amount: amountInWei,
            walletAddress: address,
            chainId: chainId
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to get quote: ${response.statusText}`);
        }

        const quote: FusionQuote = await response.json();
        setFusionQuote(quote);
        
        // Convert the response amount back to readable format
        const outputAmount = (parseInt(quote.dstAmount) / Math.pow(10, toToken.decimals)).toFixed(6);
        setToAmount(outputAmount);

      } catch (err: any) {
        console.error('Error fetching Fusion quote:', err);
        
        // Implement retry logic for transient errors
        if (retryCount < 2 && (err.message?.includes('network') || err.message?.includes('timeout'))) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            // Retry the fetch after a delay
            setIsLoading(true);
          }, 1000 * (retryCount + 1));
          return;
        }
        
        setError(err.message || 'Failed to get Fusion quote. Please try again.');
        setFusionQuote(null);
        setToAmount('');
        setRetryCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchFusionQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, chainId, isConnected, address, retryCount]);

  const handleSwapTokens = useCallback(() => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  }, [fromToken, toToken, fromAmount, toAmount]);

  const handleExecuteSwap = useCallback(async () => {
    if (!fusionQuote || !fromToken || !toToken || !address) {
      setError('Missing required data for swap execution');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to wei
      const amountInWei = (parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)).toString();
      
      // Step 1: Create Fusion order (unsigned)
      console.log('🔄 Creating Fusion order...');
      const createResponse = await fetch('/api/1inch/fusion/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount: amountInWei,
          walletAddress: address,
          chainId: chainId
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create order: ${createResponse.statusText}`);
      }

      const orderData = await createResponse.json();
      console.log('✅ Fusion order created:', orderData);
      
      // Step 2: Debug wallet client availability
      console.log('🔍 Debugging wallet state:', {
        hasWalletClient: !!walletClient,
        isConnected,
        address,
        chainId
      });
      
      if (!walletClient) {
        console.error('❌ Wallet client not available');
        throw new Error('Wallet client not available. Please ensure your wallet is connected.');
      }
      
      // Step 3: Extract and validate order details
      console.log('📦 Order data received:', orderData);
      const { order, quoteId } = orderData;
      
      if (!order) {
        console.error('❌ No order in response:', orderData);
        throw new Error('No order received from server.');
      }
      
      if (!quoteId) {
        console.error('❌ No quoteId in response:', orderData);
        throw new Error('No quote ID received from server.');
      }
      
      console.log('✅ Order validation passed:', { hasOrder: !!order, quoteId });
      
      console.log('🔐 Preparing order for wallet signature...');
      console.log('📋 Quote ID:', quoteId);
      
      // Step 4: Prepare order for signing
      const orderForSigning = prepareFusionOrderForSigning(order);
      console.log('📝 Prepared order for signing:', orderForSigning);
      
      // Step 5: Sign the order using EIP-712
      console.log('✍️ Requesting wallet signature...');
      const signature = await signFusionOrder(
        walletClient,
        orderForSigning,
        chainId,
        signTypedDataAsync
      );
      
      console.log('✅ Order signed successfully!');
      console.log('🔐 Signature:', signature.slice(0, 20) + '...');
      
      // Step 6: Submit signed order to Fusion resolver network
      console.log('📤 Submitting signed order...');
      const submitResult = await submitSignedFusionOrder(
        order,
        signature,
        quoteId,
        chainId
      );
      
      console.log('🎉 Fusion intent order submitted successfully!');
      console.log('📝 Order Hash:', submitResult.orderHash);
      console.log('📈 Status:', submitResult.status);
      
      setError(null);
      
      // Reset form after successful order creation
      setFromAmount('');
      setToAmount('');
      setFusionQuote(null);
      
    } catch (err: any) {
      console.error('Error executing Fusion swap:', err);
      setError(err.message || 'Failed to execute Fusion swap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fusionQuote, fromToken, toToken, address, fromAmount, chainId]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Main Swap Card */}
      <Card className="border-border/30 shadow-lg shadow-black/5 bg-gradient-to-br from-background to-background/95">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-light flex items-center gap-2 sm:gap-3">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              <span className="font-extralight tracking-wide">Fusion</span>
              <span className="font-medium text-muted-foreground hidden sm:inline">Intent Swap</span>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="transition-all duration-300 hover:rotate-180"
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 sm:space-y-8">
          {/* Order Type Selector */}
          <Tabs value={orderType} onValueChange={(value) => setOrderType(value as any)}>
            <TabsList className="grid w-full grid-cols-2 h-11 sm:h-10">
              <TabsTrigger value="market" className="text-sm sm:text-base">Market Order</TabsTrigger>
              <TabsTrigger value="limit" className="text-sm sm:text-base">Limit Order</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Token Input Section */}
          <div className="space-y-6">
            {/* From Token */}
            <Card className="border-border/40 shadow-sm shadow-black/5 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-sm font-medium text-muted-foreground tracking-wide">From</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-light text-muted-foreground">
                      Balance: {isConnected && fromToken ? `${formatBalance(fromTokenBalance, fromToken.symbol)} ${fromToken.symbol}` : '--'}
                    </span>
                    {isConnected && fromTokenBalance && fromToken && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFromAmount(fromTokenBalance.formatted)}
                        className="text-xs h-6 px-3 font-medium text-primary hover:text-primary/80 transition-colors rounded-lg"
                      >
                        MAX
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Token Selector Row */}
                <div className="flex items-center gap-2 mb-3">
                  <TokenSelector
                    selectedToken={fromToken}
                    onTokenSelect={(token) => setFromToken(token)}
                    label={''}
                  />
                </div>
                
                {/* Amount Input Row - Enhanced with glassmorphism */}
                <div className="relative group">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={fromAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers, decimal point, and empty string
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFromAmount(value);
                      }
                    }}
                    className="text-2xl sm:text-4xl font-light bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-sm border-2 border-border/40 rounded-2xl px-4 sm:px-6 py-6 sm:py-8 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder:text-muted-foreground/40 hover:border-border/60 hover:bg-gradient-to-br hover:from-background/80 hover:to-background/50 min-h-[64px] sm:min-h-[80px]"
                    aria-label={`Amount to swap from ${fromToken?.symbol || 'selected token'}`}
                    aria-describedby="from-amount-description"
                    role="textbox"
                  />
                  {!fromAmount && (
                    <div className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 text-lg sm:text-xl pointer-events-none font-light tracking-wide">
                      Enter amount
                    </div>
                  )}
                  {/* Subtle gradient overlay on focus */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                
                <div 
                  id="from-amount-description" 
                  className="text-right text-sm font-light text-muted-foreground mt-4 tracking-wide"
                  aria-live="polite"
                >
                  {fromAmount && fromToken ? formatUSDValue(parseFloat(fromAmount) * 3245.67) : ''}
                </div>
              </CardContent>
            </Card>

            {/* Swap Button */}
            <div className="flex justify-center -my-3 relative z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwapTokens}
                className="rounded-full p-3 hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all duration-300 bg-background/80 backdrop-blur-sm border-2 border-border/40 shadow-lg hover:shadow-xl hover:border-primary/30 touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Swap token positions"
                title="Click to swap the from and to tokens"
              >
                <ArrowDownUp className="w-5 h-5 text-primary transition-transform duration-300 group-hover:rotate-180" />
              </Button>
            </div>

            {/* To Token */}
            <Card className="border-border/40 shadow-sm shadow-black/5 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-sm font-medium text-muted-foreground tracking-wide">To</Label>
                  <span className="text-xs font-light text-muted-foreground">
                    Balance: {isConnected && toToken ? `${formatBalance(toTokenBalance, toToken.symbol)} ${toToken.symbol}` : '--'}
                  </span>
                </div>
                {/* Token Selector Row */}
                <div className="flex items-center gap-2 mb-3">
                  <TokenSelector
                    selectedToken={toToken}
                    onTokenSelect={(token) => setToToken(token)}
                    label={''}
                  />
                </div>
                
                {/* Amount Display Row - Enhanced output display */}
                <div className="relative group">
                  <div className="text-2xl sm:text-4xl font-light bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm border-2 border-border/30 rounded-2xl px-4 sm:px-6 py-6 sm:py-8 min-h-[80px] sm:min-h-[96px] flex items-center justify-end transition-all duration-300 hover:border-border/50">
                    {isLoading ? (
                      <div className="flex items-center justify-end w-full">
                        <div className="flex items-center gap-3">
                          <div className="space-y-2">
                            <div className="h-8 w-32 bg-muted/40 rounded-lg animate-pulse" />
                            <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
                          </div>
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      </div>
                    ) : (
                      <span className={`transition-all duration-500 transform ${toAmount ? 'text-foreground scale-100 opacity-100' : 'text-muted-foreground/40 scale-95 opacity-60'}`}>
                        {toAmount || '0'}
                      </span>
                    )}
                  </div>
                  {/* Subtle pulse animation when calculating */}
                  {isLoading && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent animate-pulse" />
                  )}
                </div>
                <div className="text-right text-sm font-light text-muted-foreground mt-4 tracking-wide">
                  {toAmount && toToken ? `≈ ${formatUSDValue(parseFloat(toAmount) * 1.0)}` : ''}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div 
              className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in slide-in-from-top-2 duration-300"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" aria-hidden="true" />
                <span className="text-sm text-destructive font-medium">{error}</span>
              </div>
              {retryCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive/70">Retrying... ({retryCount}/2)</span>
                  <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* ETH to WETH Notice */}
          {(fromToken?.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || toToken?.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">i</span>
                </div>
                <span className="text-sm text-blue-700">
                  Fusion uses WETH instead of ETH. Your ETH will be automatically handled as WETH for this intent swap.
                </span>
              </div>
            </div>
          )}

          {/* Fusion Quote Display */}
          {fusionQuote && !error && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <Label className="text-base font-medium tracking-wide">1inch Fusion Intent Order</Label>
              <Card className="border-primary/60 bg-primary/5 shadow-primary/10 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Fusion (Intent-Based)</span>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          MEV Protected
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Gas-free
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Intent-Based
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{toAmount} {toToken?.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        Gas: Free • ~30-60s
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Quote ID: {fusionQuote.quoteId ? fusionQuote.quoteId.slice(0, 8) + '...' : 'Pending'}</span>
                      <span className="text-green-600">Save gas fees</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      via Fusion Resolvers Network
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Settings */}
          {showAdvanced && (
            <Card className="border-border/40 shadow-sm shadow-black/5 bg-gradient-to-br from-card/30 to-card/10 animate-in slide-in-from-top-4 duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium tracking-wide flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Slippage Tolerance</Label>
                    <div className="flex gap-2 mt-1">
                      {['0.1', '0.5', '1.0'].map((value) => (
                        <Button
                          key={value}
                          variant={slippage === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSlippage(value)}
                          className="text-xs"
                        >
                          {value}%
                        </Button>
                      ))}
                      <Input
                        type="number"
                        placeholder="Custom"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-20 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Transaction Deadline</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="text-xs"
                      />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execute Button */}
          <Button 
            onClick={handleExecuteSwap}
            disabled={!fusionQuote || !isConnected || isLoading || !!error}
            className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-300 shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none touch-manipulation"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-light tracking-wide">
                  {!fusionQuote ? 'Getting Quote...' : 'Creating Intent Order...'}
                </span>
              </div>
            ) : !isConnected ? (
              <span className="font-light tracking-wide">Connect Wallet</span>
            ) : !fromAmount || !toAmount ? (
              <span className="font-light tracking-wide">Enter Amount</span>
            ) : error ? (
              <span className="font-light tracking-wide">Error</span>
            ) : (
              <span className="font-light tracking-wide">
                Create Fusion Intent Order
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Fusion Intent Summary */}
      {fusionQuote && !error && (
        <Card className="border-border/30 shadow-lg shadow-black/5 bg-gradient-to-br from-card/40 to-card/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2 tracking-wide">
              <Shield className="w-5 h-5" />
              Fusion Intent Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Protocol</span>
              <span className="font-medium">1inch Fusion (Intent-Based)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Output</span>
              <span className="font-medium">{toAmount} {toToken?.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Cost</span>
              <span className="font-medium text-green-600">Free (Gasless)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Execution Time</span>
              <span className="font-medium">~30-60 seconds</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">MEV Protection</span>
              <span className="font-medium text-green-600">✓ Protected</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between text-sm font-medium">
                <span>Minimum Received</span>
                <span>
                  {(parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken?.symbol}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
