'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowDownUp, Zap, Globe, Clock, TrendingUp } from 'lucide-react';
import { oneInchService } from '@/lib/1inch';

interface SwapQuote {
  dstAmount: string;
  estimatedGas: string;
  protocols?: any[];
  tx?: any;
}

export default function AdvancedSwapInterface() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [activeProtocol, setActiveProtocol] = useState<'classic' | 'fusion' | 'fusion-plus' | 'limit-order'>('classic');
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [crossChainData, setCrossChainData] = useState({
    srcChainId: chainId,
    dstChainId: 137, // Polygon as default
  });
  const [limitOrderData, setLimitOrderData] = useState({
    price: '',
    expiry: '',
  });

  const supportedChains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 42161, name: 'Arbitrum', symbol: 'ARB' },
    { id: 10, name: 'Optimism', symbol: 'OP' },
    { id: 8453, name: 'Base', symbol: 'BASE' },
  ];

  const getQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || !isConnected) return;
    
    setIsLoading(true);
    try {
      let quoteResult;
      
      switch (activeProtocol) {
        case 'classic':
          quoteResult = await oneInchService.getQuote(chainId, fromToken, toToken, fromAmount);
          break;
        case 'fusion':
          quoteResult = await oneInchService.getFusionQuote(chainId, fromToken, toToken, fromAmount, address!);
          break;
        case 'fusion-plus':
          quoteResult = await oneInchService.getFusionPlusQuote(
            crossChainData.srcChainId,
            crossChainData.dstChainId,
            fromToken,
            toToken,
            fromAmount,
            address!
          );
          break;
        case 'limit-order':
          // For limit orders, we calculate based on user-specified price
          const calculatedAmount = (parseFloat(fromAmount) * parseFloat(limitOrderData.price)).toString();
          setToAmount(calculatedAmount);
          return;
      }
      
      setQuote(quoteResult);
      setToAmount(quoteResult.dstAmount);
    } catch (error) {
      console.error('Error getting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !isConnected) return;
    
    setIsLoading(true);
    try {
      let result;
      
      switch (activeProtocol) {
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
            srcChainId: crossChainData.srcChainId,
            dstChainId: crossChainData.dstChainId,
            src: fromToken,
            dst: toToken,
            amount: fromAmount,
            from: address!,
          });
          break;
        case 'limit-order':
          result = await oneInchService.createLimitOrder(chainId, {
            makerAsset: fromToken,
            takerAsset: toToken,
            makingAmount: fromAmount,
            takingAmount: toAmount,
            maker: address!,
          });
          break;
      }
      
      console.log('Swap executed:', result);
    } catch (error) {
      console.error('Error executing swap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProtocolBadge = (protocol: string) => {
    const badges = {
      classic: { color: 'bg-blue-500/20 text-blue-300', icon: TrendingUp, label: 'Classic' },
      fusion: { color: 'bg-purple-500/20 text-purple-300', icon: Zap, label: 'Fusion' },
      'fusion-plus': { color: 'bg-green-500/20 text-green-300', icon: Globe, label: 'Fusion+' },
      'limit-order': { color: 'bg-orange-500/20 text-orange-300', icon: Clock, label: 'Limit Order' },
    };
    
    const badge = badges[protocol as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <Badge className={`${badge.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="gradient-text">Advanced Swap Protocols</span>
          {getProtocolBadge(activeProtocol)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeProtocol} onValueChange={(value) => setActiveProtocol(value as any)}>
          <TabsList className="grid w-full grid-cols-4 bg-white/5">
            <TabsTrigger value="classic" className="data-[state=active]:bg-blue-500/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Classic
            </TabsTrigger>
            <TabsTrigger value="fusion" className="data-[state=active]:bg-purple-500/20">
              <Zap className="w-4 h-4 mr-2" />
              Fusion
            </TabsTrigger>
            <TabsTrigger value="fusion-plus" className="data-[state=active]:bg-green-500/20">
              <Globe className="w-4 h-4 mr-2" />
              Fusion+
            </TabsTrigger>
            <TabsTrigger value="limit-order" className="data-[state=active]:bg-orange-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Limit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classic" className="space-y-4">
            <div className="text-sm text-gray-400">
              🔄 Classic aggregated swap with best rates across DEXes
            </div>
          </TabsContent>

          <TabsContent value="fusion" className="space-y-4">
            <div className="text-sm text-gray-400">
              ⚡ Intent-based swap with MEV protection and gas-free execution
            </div>
          </TabsContent>

          <TabsContent value="fusion-plus" className="space-y-4">
            <div className="text-sm text-gray-400">
              🌍 Cross-chain swap without bridges - seamless multi-chain experience
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Chain</Label>
                <select 
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg"
                  value={crossChainData.srcChainId}
                  onChange={(e) => setCrossChainData(prev => ({ ...prev, srcChainId: parseInt(e.target.value) }))}
                >
                  {supportedChains.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Destination Chain</Label>
                <select 
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg"
                  value={crossChainData.dstChainId}
                  onChange={(e) => setCrossChainData(prev => ({ ...prev, dstChainId: parseInt(e.target.value) }))}
                >
                  {supportedChains.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="limit-order" className="space-y-4">
            <div className="text-sm text-gray-400">
              ⏰ Set your desired price and let the order execute automatically
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Price</Label>
                <Input
                  placeholder="0.00"
                  value={limitOrderData.price}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label>Expiry (hours)</Label>
                <Input
                  placeholder="24"
                  value={limitOrderData.expiry}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, expiry: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Token Input Section */}
        <div className="space-y-4">
          <div className="relative">
            <div className="glass-card p-4 border-white/10">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm text-gray-400">From</Label>
                <span className="text-xs text-gray-500">Balance: 0.00</span>
              </div>
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
                  className="w-40 bg-white/5 border-white/10"
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
                  setFromAmount(toAmount);
                  setToAmount(fromAmount);
                }}
              >
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="glass-card p-4 border-white/10">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm text-gray-400">To</Label>
                <span className="text-xs text-gray-500">Balance: 0.00</span>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="flex-1 bg-transparent border-0 text-xl p-0 h-auto"
                />
                <Input
                  placeholder="Token address"
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="w-40 bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Quote Information */}
          {quote && (
            <div className="glass-card p-4 border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Gas:</span>
                <span>{quote.estimatedGas}</span>
              </div>
              {quote.protocols && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Protocols:</span>
                  <span>{quote.protocols.length} sources</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={getQuote}
              disabled={!fromToken || !toToken || !fromAmount || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? 'Getting Quote...' : 'Get Quote'}
            </Button>
            
            {quote && (
              <Button
                onClick={executeSwap}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isLoading ? 'Executing...' : `Execute ${activeProtocol} Swap`}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
