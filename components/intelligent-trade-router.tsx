'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownUp, Zap, Globe, TrendingUp, Shield, Clock, AlertTriangle } from 'lucide-react';
import { oneInchService } from '@/lib/1inch';

interface RouteComparison {
  protocol: 'classic' | 'fusion' | 'fusion-plus';
  dstAmount: string;
  estimatedGas: string;
  executionTime: string;
  mevProtection: boolean;
  gasless: boolean;
  crossChain: boolean;
  recommendation: 'best' | 'good' | 'suboptimal';
  savings?: string;
}

export default function IntelligentTradeRouter() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [fromToken, setFromToken] = useState('0xA0b86a33E6441b8e8C7C7b0b8b8b8b8b8b8b8b8b'); // ETH
  const [toToken, setToToken] = useState('0xdAC17F958D2ee523a2206206994597C13D831ec7'); // USDT
  const [fromAmount, setFromAmount] = useState('');
  const [routes, setRoutes] = useState<RouteComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteComparison | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);

  const getRouteComparison = async () => {
    if (!fromToken || !toToken || !fromAmount || !isConnected) return;
    
    setIsLoading(true);
    try {
      // Get quotes from all protocols simultaneously
      const [classicQuote, fusionQuote, fusionPlusQuote] = await Promise.all([
        oneInchService.getQuote(chainId, fromToken, toToken, fromAmount).catch(() => null),
        oneInchService.getFusionQuote(chainId, fromToken, toToken, fromAmount, address!).catch(() => null),
        oneInchService.getFusionPlusQuote(chainId, 137, fromToken, toToken, fromAmount, address!).catch(() => null)
      ]);

      const routeComparisons: RouteComparison[] = [];

      // Classic Route
      if (classicQuote) {
        routeComparisons.push({
          protocol: 'classic',
          dstAmount: classicQuote.dstAmount,
          estimatedGas: classicQuote.estimatedGas || '150000',
          executionTime: '~15s',
          mevProtection: false,
          gasless: false,
          crossChain: false,
          recommendation: 'good'
        });
      }

      // Fusion Route
      if (fusionQuote) {
        routeComparisons.push({
          protocol: 'fusion',
          dstAmount: fusionQuote.dstAmount || fusionQuote.toAmount,
          estimatedGas: '0',
          executionTime: '~30s',
          mevProtection: true,
          gasless: true,
          crossChain: false,
          recommendation: 'best',
          savings: 'Gas-free + MEV protected'
        });
      }

      // Fusion+ Route
      if (fusionPlusQuote) {
        routeComparisons.push({
          protocol: 'fusion-plus',
          dstAmount: fusionPlusQuote.dstAmount || fusionPlusQuote.toAmount,
          estimatedGas: '0',
          executionTime: '~60s',
          mevProtection: true,
          gasless: true,
          crossChain: true,
          recommendation: 'good',
          savings: 'Cross-chain + Gas-free'
        });
      }

      // Sort by recommendation and amount
      routeComparisons.sort((a, b) => {
        if (a.recommendation === 'best' && b.recommendation !== 'best') return -1;
        if (b.recommendation === 'best' && a.recommendation !== 'best') return 1;
        return parseFloat(b.dstAmount) - parseFloat(a.dstAmount);
      });

      setRoutes(routeComparisons);
      
      // Auto-select best route
      if (autoSelect && routeComparisons.length > 0) {
        setSelectedRoute(routeComparisons[0]);
      }
    } catch (error) {
      console.error('Error getting route comparison:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSelectedRoute = async () => {
    if (!selectedRoute || !isConnected) return;
    
    setIsLoading(true);
    try {
      let result;
      
      switch (selectedRoute.protocol) {
        case 'classic':
          result = await oneInchService.executeSwap(chainId, fromToken, toToken, fromAmount, address!, 1);
          break;
        case 'fusion':
          result = await oneInchService.submitFusionOrder(chainId, {
            src: fromToken,
            dst: toToken,
            amount: fromAmount,
            from: address!,
          });
          break;
        case 'fusion-plus':
          result = await oneInchService.submitFusionPlusOrder({
            srcChainId: chainId,
            dstChainId: 137,
            src: fromToken,
            dst: toToken,
            amount: fromAmount,
            from: address!,
          });
          break;
      }
      
      console.log('Trade executed:', result);
    } catch (error) {
      console.error('Error executing trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'classic': return TrendingUp;
      case 'fusion': return Zap;
      case 'fusion-plus': return Globe;
      default: return TrendingUp;
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'best':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">✨ Recommended</Badge>;
      case 'good':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Good Option</Badge>;
      case 'suboptimal':
        return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">⚠️ Suboptimal</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="gradient-text">Intelligent Trade Router</span>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Input Section */}
        <div className="space-y-4">
          <div className="glass-card p-4 border-white/10">
            <Label className="text-sm text-gray-400 mb-2 block">From</Label>
            <div className="flex gap-3">
              <Input
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent border-0 text-xl p-0 h-auto"
              />
              <Input
                placeholder="Token address"
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="w-40 bg-white/5 border-white/10 text-xs"
              />
            </div>
          </div>
          
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-gray-800 border-white/10 hover:bg-gray-700"
              onClick={() => {
                setFromToken(toToken);
                setToToken(fromToken);
              }}
            >
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="glass-card p-4 border-white/10">
            <Label className="text-sm text-gray-400 mb-2 block">To</Label>
            <div className="flex gap-3">
              <div className="flex-1 text-xl text-gray-400">
                {selectedRoute ? parseFloat(selectedRoute.dstAmount).toFixed(6) : '0.00'}
              </div>
              <Input
                placeholder="Token address"
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="w-40 bg-white/5 border-white/10 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Get Routes Button */}
        <Button
          onClick={getRouteComparison}
          disabled={!fromToken || !toToken || !fromAmount || isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          {isLoading ? 'Analyzing Routes...' : 'Compare All Protocols'}
        </Button>

        {/* Route Comparison */}
        {routes.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Route Comparison</Label>
            {routes.map((route, index) => {
              const Icon = getProtocolIcon(route.protocol);
              const isSelected = selectedRoute?.protocol === route.protocol;
              
              return (
                <Card 
                  key={route.protocol}
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'glass-card border-purple-500/50 bg-purple-500/10' 
                      : 'glass-card border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedRoute(route)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium capitalize">{route.protocol.replace('-', '+')}</span>
                        {getRecommendationBadge(route.recommendation)}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{parseFloat(route.dstAmount).toFixed(6)}</div>
                        {route.savings && (
                          <div className="text-xs text-green-400">{route.savings}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.executionTime}
                      </div>
                      <div className="flex items-center gap-1">
                        {route.gasless ? (
                          <>
                            <Zap className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Gas-free</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span>~{route.estimatedGas} gas</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {route.mevProtection ? (
                          <>
                            <Shield className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">MEV Protected</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span>No MEV protection</span>
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
                          <span>Same chain</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Execute Button */}
        {selectedRoute && (
          <Button
            onClick={executeSelectedRoute}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
          >
            {isLoading ? 'Executing...' : `Execute via ${selectedRoute.protocol.replace('-', '+')}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
