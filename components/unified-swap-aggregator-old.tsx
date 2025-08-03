'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowDownUp, 
  Zap, 
  Globe, 
  TrendingUp, 
  Shield, 
  Clock, 
  Settings,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { oneInchService } from '@/lib/1inch';

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

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export default function UnifiedSwapAggregator() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Token Selection
  const [fromToken, setFromToken] = useState<Token>({
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18
  });
  const [toToken, setToToken] = useState<Token>({
    address: '0xA0b86a33E6441b8e8C7C7b0b8b8b8b8b8b8b8b8b',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  });
  
  // Swap State
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [routes, setRoutes] = useState<SwapRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Multi-chain
  const [selectedChains, setSelectedChains] = useState({
    from: chainId,
    to: chainId
  });
  
  // Advanced Options
  const [slippage, setSlippage] = useState('0.5');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  
  const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
    { id: 137, name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
    { id: 42161, name: 'Arbitrum', symbol: 'ARB', color: 'bg-blue-400' },
    { id: 10, name: 'Optimism', symbol: 'OP', color: 'bg-red-500' },
    { id: 8453, name: 'Base', symbol: 'BASE', color: 'bg-blue-600' },
  ];

  const getRoutes = async () => {
    if (!fromToken || !toToken || !fromAmount || !isConnected) return;
    
    setIsLoadingRoutes(true);
    try {
      const routePromises = [];
      
      // Classic Route
      routePromises.push(
        oneInchService.getQuote(selectedChains.from, fromToken.address, toToken.address, fromAmount)
          .then(quote => ({
            protocol: 'classic' as const,
            name: 'Classic Aggregation',
            dstAmount: quote.dstAmount,
            estimatedGas: quote.estimatedGas || '150000',
            executionTime: '~15s',
            mevProtection: false,
            gasless: false,
            crossChain: selectedChains.from !== selectedChains.to,
            confidence: 85,
            protocols: quote.protocols?.map((p: any) => p.name) || ['Multiple DEXs']
          }))
          .catch(() => null)
      );
      
      // Fusion Route
      routePromises.push(
        oneInchService.getFusionQuote(selectedChains.from, fromToken.address, toToken.address, fromAmount, address!)
          .then(quote => ({
            protocol: 'fusion' as const,
            name: 'Fusion (MEV Protected)',
            dstAmount: quote.dstAmount || quote.toAmount,
            estimatedGas: '0',
            executionTime: '~30s',
            mevProtection: true,
            gasless: true,
            crossChain: false,
            confidence: 95,
            savings: 'Gas-free + MEV protected',
            protocols: ['Fusion Resolvers']
          }))
          .catch(() => null)
      );
      
      // Fusion+ Route (if cross-chain)
      if (selectedChains.from !== selectedChains.to) {
        routePromises.push(
          oneInchService.getFusionPlusQuote(selectedChains.from, selectedChains.to, fromToken.address, toToken.address, fromAmount, address!)
            .then(quote => ({
              protocol: 'fusion-plus' as const,
              name: 'Fusion+ (Cross-Chain)',
              dstAmount: quote.dstAmount || quote.toAmount,
              estimatedGas: '0',
              executionTime: '~60s',
              mevProtection: true,
              gasless: true,
              crossChain: true,
              confidence: 90,
              savings: 'Bridge-free + Gas-free',
              protocols: ['Cross-Chain Resolvers']
            }))
            .catch(() => null)
        );
      }
      
      const results = await Promise.all(routePromises);
      const validRoutes = results.filter(Boolean) as SwapRoute[];
      
      // Sort by confidence and amount
      validRoutes.sort((a, b) => {
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        return parseFloat(b.dstAmount) - parseFloat(a.dstAmount);
      });
      
      setRoutes(validRoutes);
      
      // Auto-select best route
      if (validRoutes.length > 0) {
        setSelectedRoute(validRoutes[0]);
        setToAmount(validRoutes[0].dstAmount);
      }
    } catch (error) {
      console.error('Error getting routes:', error);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const executeSwap = async () => {
    if (!selectedRoute || !isConnected) return;
    
    setIsExecuting(true);
    try {
      let result;
      
      if (orderType === 'limit') {
        // Create limit order
        result = await oneInchService.createLimitOrder(selectedChains.from, {
          makerAsset: fromToken.address,
          takerAsset: toToken.address,
          makingAmount: fromAmount,
          takingAmount: (parseFloat(fromAmount) * parseFloat(limitPrice)).toString(),
          maker: address!,
        });
      } else {
        // Execute market order
        switch (selectedRoute.protocol) {
          case 'classic':
            result = await oneInchService.executeSwap(
              selectedChains.from, 
              fromToken.address, 
              toToken.address, 
              fromAmount, 
              address!, 
              parseFloat(slippage)
            );
            break;
          case 'fusion':
            result = await oneInchService.submitFusionOrder(selectedChains.from, {
              src: fromToken.address,
              dst: toToken.address,
              amount: fromAmount,
              from: address!,
            });
            break;
          case 'fusion-plus':
            result = await oneInchService.submitFusionPlusOrder({
              srcChainId: selectedChains.from,
              dstChainId: selectedChains.to,
              src: fromToken.address,
              dst: toToken.address,
              amount: fromAmount,
              from: address!,
            });
            break;
        }
      }
      
      console.log('Swap executed:', result);
    } catch (error) {
      console.error('Error executing swap:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRouteIcon = (protocol: string) => {
    switch (protocol) {
      case 'classic': return TrendingUp;
      case 'fusion': return Zap;
      case 'fusion-plus': return Globe;
      default: return TrendingUp;
    }
  };

  const getChainBadge = (chainId: number) => {
    const chain = chains.find(c => c.id === chainId);
    return chain ? (
      <div className={`px-2 py-1 rounded text-xs text-white ${chain.color}`}>
        {chain.symbol}
      </div>
    ) : null;
  };

  // Auto-fetch routes when inputs change
  useEffect(() => {

return (
  <div className="max-w-2xl mx-auto space-y-6">
    {/* Main Swap Card */}
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Nexus Aggregator
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="border-white/10 hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Type Selector */}
        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as any)}>
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="market">Market Order</TabsTrigger>
            <TabsTrigger value="limit">Limit Order</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Token Input Section */}
        <div className="space-y-4">
          {/* From Token */}
          <div className="glass-card p-4 border-white/10">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm text-gray-400">From</Label>
              <div className="flex items-center gap-2">
                {getChainBadge(selectedChains.from)}
                <select 
                  value={selectedChains.from}
                  onChange={(e) => setSelectedChains(prev => ({ ...prev, from: parseInt(e.target.value) }))}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                >
                  {chains.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Input
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent border-0 text-2xl p-0 h-auto font-medium"
              />
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <span className="font-medium">{fromToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-gray-800 border-white/10 hover:bg-gray-700"
              onClick={() => {
                setFromToken(toToken);
                setToToken(fromToken);
                setFromAmount(toAmount);
                setToAmount(fromAmount);
                setSelectedChains(prev => ({ from: prev.to, to: prev.from }));
              }}
            >
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          </div>
          
          {/* To Token */}
          <div className="glass-card p-4 border-white/10">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm text-gray-400">To</Label>
              <div className="flex items-center gap-2">
                {getChainBadge(selectedChains.to)}
                <select 
                  value={selectedChains.to}
                  onChange={(e) => setSelectedChains(prev => ({ ...prev, to: parseInt(e.target.value) }))}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                >
                  {chains.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1 text-2xl font-medium text-gray-300">
                {orderType === 'limit' && limitPrice ? 
                  (parseFloat(fromAmount || '0') * parseFloat(limitPrice)).toFixed(6) :
                  (selectedRoute ? parseFloat(selectedRoute.dstAmount).toFixed(6) : '0.00')
                }
              </div>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
                <span className="font-medium">{toToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Limit Order Price */}
        {orderType === 'limit' && (
          <div className="glass-card p-4 border-white/10">
            <Label className="text-sm text-gray-400 mb-2 block">Limit Price</Label>
            <Input
              placeholder="0.00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="bg-transparent border-white/10"
            />
            <div className="text-xs text-gray-500 mt-1">
              Price per {fromToken.symbol} in {toToken.symbol}
            </div>
          </div>
        )}

        {/* Route Selection */}
        {routes.length > 0 && orderType === 'market' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Best Routes</Label>
              {isLoadingRoutes && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
            {routes.map((route, index) => {
              const Icon = getRouteIcon(route.protocol);
              const isSelected = selectedRoute?.protocol === route.protocol;
              
              return (
                <Card 
                  key={route.protocol}
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'glass-card border-purple-500/50 bg-purple-500/10' 
                      : 'glass-card border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => {
                    setSelectedRoute(route);
                    setToAmount(route.dstAmount);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{route.name}</span>
                        {index === 0 && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Best
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{parseFloat(route.dstAmount).toFixed(6)}</div>
                        {route.savings && (
                          <div className="text-xs text-green-400">{route.savings}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.executionTime}
                      </div>
                      <div className="flex items-center gap-1">
                        {route.gasless ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Gas-free</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span>~{route.estimatedGas}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {route.mevProtection ? (
                          <>
                            <Shield className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Protected</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span>No MEV shield</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {route.crossChain ? (
                          <>
                            <Globe className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-400">Cross-chain</span>
                          </>
                        ) : (
                          <span className="text-gray-400">Same chain</span>
                        )}
                      </div>
                    </div>
                    
                    {route.protocols && (
                      <div className="mt-2 text-xs text-gray-400">
                        Via: {route.protocols.slice(0, 3).join(', ')}
                        {route.protocols.length > 3 && ` +${route.protocols.length - 3} more`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="glass-card p-4 border-white/10 space-y-3">
            <Label className="text-sm font-medium">Advanced Settings</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-400">Slippage Tolerance</Label>
                <Input
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="bg-white/5 border-white/10 mt-1"
                  placeholder="0.5"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Transaction Deadline</Label>
                <Input
                  defaultValue="20"
                  className="bg-white/5 border-white/10 mt-1"
                  placeholder="20 minutes"
                />
              </div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={executeSwap}
          disabled={!isConnected || isExecuting || (!selectedRoute && orderType === 'market') || (orderType === 'limit' && !limitPrice)}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 h-12 text-lg font-medium"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : orderType === 'limit' ? (
            'Place Limit Order'
          ) : selectedRoute ? (
            `Swap via ${selectedRoute.name}`
          ) : (
            'Select Route to Swap'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
