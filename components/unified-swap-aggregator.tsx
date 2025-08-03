'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowDownUp, 
  Zap, 
  Globe, 
  TrendingUp, 
  Shield, 
  Settings,
  ChevronDown,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Token, QuoteResponse, oneInchService } from '@/lib/1inch';
import { TokenSelector } from '@/components/token-selector';
import ProtocolFlowDiagram from '@/components/protocol-flow-diagram';

interface SwapRoute {
  protocol: 'classic' | 'fusion' | 'fusion-plus';
  name: string;
  dstAmount: string;
  estimatedGas: string;
  executionTime: string;
  mevProtection: boolean;
  gasless: boolean;
  crossChain: boolean;
  savings?: string;
  confidence: number;
  protocols?: string[];
}

export default function UnifiedSwapAggregator() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId() || 1;
  
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
  const [routes, setRoutes] = useState<SwapRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProtocolDiagram, setShowProtocolDiagram] = useState(false);
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

  // Fetch quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || !fromToken || !toToken || !isConnected) {
        setRoutes([]);
        setSelectedRoute(null);
        setToAmount('');
        return;
      }

      // Don't fetch quote for zero or invalid amounts
      const numericAmount = parseFloat(fromAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setRoutes([]);
        setSelectedRoute(null);
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
        
        // Get quote from 1inch API
        const quote = await oneInchService.getQuote(
          chainId,
          fromToken.address,
          toToken.address,
          amountInWei
        );

        setQuoteData(quote);
        
        // Convert the response amount back to readable format
        const outputAmount = (parseInt(quote.dstAmount) / Math.pow(10, toToken.decimals)).toFixed(6);
        setToAmount(outputAmount);

        // Extract protocol names from the nested structure
        const protocolNames = quote.protocols
          .flat(2)
          .map(protocol => protocol.name)
          .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates

        // Calculate estimated gas cost in USD (rough estimation: gas * 20 gwei * ETH price)
        const estimatedGasCost = `$${(quote.gas / 1e9 * 20).toFixed(2)}`;

        // Create routes based on the quote response
        const classicRoute: SwapRoute = {
          protocol: 'classic',
          name: 'Classic Swap',
          dstAmount: outputAmount,
          estimatedGas: estimatedGasCost,
          executionTime: '~15s',
          mevProtection: false,
          gasless: false,
          crossChain: false,
          confidence: 95,
          protocols: protocolNames
        };

        // Simulate Fusion route (with slight reduction for MEV protection cost)
        const fusionRoute: SwapRoute = {
          protocol: 'fusion',
          name: 'Fusion (MEV Protected)',
          dstAmount: (parseFloat(outputAmount) * 0.998).toFixed(6), // Slightly less due to MEV protection
          estimatedGas: 'Gas-free',
          executionTime: '~30s',
          mevProtection: true,
          gasless: true,
          crossChain: false,
          savings: estimatedGasCost,
          confidence: 92,
          protocols: ['Fusion Network']
        };

        const newRoutes = [fusionRoute, classicRoute];
        setRoutes(newRoutes);
        setSelectedRoute(newRoutes[0]); // Default to Fusion for better UX

      } catch (err: any) {
        console.error('Error fetching quote:', err);
        
        // Implement retry logic for transient errors
        if (retryCount < 2 && (err.message?.includes('network') || err.message?.includes('timeout'))) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            // Retry the fetch after a delay
            setIsLoading(true);
          }, 1000 * (retryCount + 1));
          return;
        }
        
        setError(err.message || 'Failed to get quote. Please try again.');
        setRoutes([]);
        setSelectedRoute(null);
        setToAmount('');
        setRetryCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, chainId, isConnected]);

  const handleSwapTokens = useCallback(() => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  }, [fromToken, toToken, fromAmount, toAmount]);

  const handleExecuteSwap = useCallback(async () => {
    if (!selectedRoute || !fromToken || !toToken || !address || !quoteData) {
      setError('Missing required data for swap execution');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to wei
      const amountInWei = (parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)).toString();
      
      if (selectedRoute.protocol === 'fusion') {
        // Use Fusion SDK for MEV-protected swaps
        const { fusionService } = await import('@/lib/fusion');
        const fusionOrder = await fusionService.createOrder({
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount: amountInWei,
          walletAddress: address,
        });
        console.log('Fusion order created:', fusionOrder);
        
        // Submit the order
        const orderHash = await fusionService.submitOrder(
          fusionOrder.order,
          fusionOrder.quoteId,
          chainId
        );
        console.log('Fusion order submitted:', orderHash);
      } else {
        // Use classic swap
        const swapData = await oneInchService.getSwap(
          chainId,
          fromToken.address,
          toToken.address,
          amountInWei,
          address,
          parseFloat(slippage)
        );
        console.log('Classic swap data:', swapData);
        // Here you would execute the transaction using wagmi/viem
      }
      
      // Reset form after successful swap
      setFromAmount('');
      setToAmount('');
      
    } catch (err: any) {
      console.error('Error executing swap:', err);
      setError(err.message || 'Failed to execute swap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoute, fromToken, toToken, address, quoteData, fromAmount, chainId, slippage]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Main Swap Card */}
      <Card className="border-border/30 shadow-lg shadow-black/5 bg-gradient-to-br from-background to-background/95">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-light flex items-center gap-2 sm:gap-3">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="font-extralight tracking-wide">Nexus</span>
              <span className="font-medium text-muted-foreground hidden sm:inline">Aggregator</span>
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

          {/* Route Comparison */}
          {routes.length > 0 && !error && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <Label className="text-base font-medium tracking-wide">Route Comparison</Label>
              <div className="space-y-3">
                {routes.map((route, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all duration-300 shadow-sm transform hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-left-2 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selectedRoute === route 
                        ? 'border-primary/60 bg-primary/5 shadow-primary/10 scale-[1.02]' 
                        : 'border-border/40 hover:border-border/60 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedRoute(route)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedRoute === route}
                    aria-label={`Select ${route.name} route: ${route.dstAmount} ${toToken?.symbol}, gas cost ${route.estimatedGas}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRoute(route);
                      }
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {route.protocol === 'fusion' && <Shield className="w-4 h-4 text-green-500" />}
                            {route.protocol === 'classic' && <Zap className="w-4 h-4 text-blue-500" />}
                            {route.protocol === 'fusion-plus' && <Globe className="w-4 h-4 text-purple-500" />}
                            <span className="font-medium">{route.name}</span>
                          </div>
                          <div className="flex gap-1">
                            {route.mevProtection && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                MEV Protected
                              </Badge>
                            )}
                            {route.gasless && (
                              <Badge variant="secondary" className="text-xs">
                                Gas-free
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{route.dstAmount} {toToken?.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            Gas: {route.estimatedGas} • {route.executionTime}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Confidence: {route.confidence}%</span>
                          {route.savings && (
                            <span className="text-green-600">Save {route.savings}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          via {route.protocols?.join(', ') || 'Multiple DEXs'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            disabled={!selectedRoute || !isConnected || isLoading || !!error}
            className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none touch-manipulation"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-light tracking-wide">
                  {routes.length === 0 ? 'Getting Quote...' : 'Executing Swap...'}
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
                Swap via {selectedRoute?.name || 'Route'}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      {selectedRoute && !error && (
        <Card className="border-border/30 shadow-lg shadow-black/5 bg-gradient-to-br from-card/40 to-card/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2 tracking-wide">
              <TrendingUp className="w-5 h-5" />
              Transaction Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">{selectedRoute.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Output</span>
              <span className="font-medium">{selectedRoute.dstAmount} {toToken?.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Cost</span>
              <span className="font-medium">{selectedRoute.estimatedGas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Execution Time</span>
              <span className="font-medium">{selectedRoute.executionTime}</span>
            </div>
            {selectedRoute.savings && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You Save</span>
                <span className="font-medium text-green-600">{selectedRoute.savings}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between text-sm font-medium">
                <span>Minimum Received</span>
                <span>
                  {(parseFloat(selectedRoute.dstAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken?.symbol}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Protocol Flow Diagram */}
      {quoteData && selectedRoute?.protocol === 'classic' && (
        <Card className="border-border/30 shadow-lg shadow-black/5 bg-gradient-to-br from-card/30 to-card/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2 tracking-wide">
                <Globe className="w-5 h-5" />
                Routing Flow Diagram
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProtocolDiagram(!showProtocolDiagram)}
                className="text-xs transition-all duration-200 hover:bg-primary/10"
              >
                <span className="transition-all duration-200">
                  {showProtocolDiagram ? 'Hide Details' : 'Show Details'}
                </span>
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-300 ${showProtocolDiagram ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showProtocolDiagram ? (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Swap routes through {quoteData.protocols.flat(2).length} protocols across {quoteData.protocols.length} path{quoteData.protocols.length > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-muted-foreground">
                  Click "Show Details" to view the routing diagram
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground mb-4">
                  <strong>1inch Pathfinder Algorithm:</strong> Your swap is intelligently split across {quoteData.protocols.length} routing path{quoteData.protocols.length > 1 ? 's' : ''} for optimal pricing
                </div>
                
                {/* React Flow Diagram */}
                <ProtocolFlowDiagram
                  quoteData={quoteData}
                  fromToken={fromToken!}
                  toToken={toToken!}
                  fromAmount={fromAmount}
                  toAmount={selectedRoute.dstAmount}
                />
                
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Total Protocols</div>
                    <div className="text-sm font-medium">
                      {quoteData.protocols.flat(2).length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Routing Paths</div>
                    <div className="text-sm font-medium">
                      {quoteData.protocols.length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Gas Estimate</div>
                    <div className="text-sm font-medium">
                      {quoteData.gas.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
