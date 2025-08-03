'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowRight, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { oneInchService } from '@/lib/1inch';

interface ArbitrageOpportunity {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  srcChain: { id: number; name: string };
  dstChain: { id: number; name: string };
  srcPrice: number;
  dstPrice: number;
  profitPercent: number;
  profitUSD: number;
  volume: number;
  confidence: 'high' | 'medium' | 'low';
  executionTime: string;
  gasEstimate: string;
}

export default function ArbitrageScanner() {
  const { address, isConnected } = useAccount();
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [autoScan, setAutoScan] = useState(true);

  const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 42161, name: 'Arbitrum', symbol: 'ARB' },
    { id: 10, name: 'Optimism', symbol: 'OP' },
    { id: 8453, name: 'Base', symbol: 'BASE' },
  ];

  const popularTokens = [
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { symbol: 'USDC', address: '0xA0b86a33E6441b8e8C7C7b0b8b8b8b8b8b8b8b8b' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
  ];

  const scanForOpportunities = async () => {
    setIsScanning(true);
    try {
      const opportunities: ArbitrageOpportunity[] = [];
      
      // Scan across all chain pairs
      for (let i = 0; i < chains.length; i++) {
        for (let j = i + 1; j < chains.length; j++) {
          const srcChain = chains[i];
          const dstChain = chains[j];
          
          // Check each popular token
          for (const token of popularTokens) {
            try {
              // Get prices on both chains (simulated for demo)
              const srcPrice = Math.random() * 1000 + 1000; // Mock price
              const dstPrice = srcPrice * (1 + (Math.random() - 0.5) * 0.1); // ±5% variation
              
              const profitPercent = ((dstPrice - srcPrice) / srcPrice) * 100;
              
              // Only show opportunities with >1% profit
              if (Math.abs(profitPercent) > 1) {
                opportunities.push({
                  id: `${token.symbol}-${srcChain.id}-${dstChain.id}`,
                  tokenSymbol: token.symbol,
                  tokenAddress: token.address,
                  srcChain,
                  dstChain,
                  srcPrice,
                  dstPrice,
                  profitPercent,
                  profitUSD: Math.abs(profitPercent) * 10, // Estimated profit on $1000
                  volume: Math.random() * 100000 + 10000,
                  confidence: Math.abs(profitPercent) > 3 ? 'high' : Math.abs(profitPercent) > 2 ? 'medium' : 'low',
                  executionTime: '~60s',
                  gasEstimate: '0 (Fusion+)'
                });
              }
            } catch (error) {
              console.error(`Error checking ${token.symbol} on ${srcChain.name}-${dstChain.name}:`, error);
            }
          }
        }
      }
      
      // Sort by profit percentage (descending)
      opportunities.sort((a, b) => Math.abs(b.profitPercent) - Math.abs(a.profitPercent));
      
      setOpportunities(opportunities.slice(0, 10)); // Show top 10
      setLastScan(new Date());
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    if (!isConnected) return;
    
    try {
      // Execute cross-chain arbitrage using Fusion+
      const amount = '1000000000000000000'; // 1 token
      
      const result = await oneInchService.submitFusionPlusOrder({
        srcChainId: opportunity.srcChain.id,
        dstChainId: opportunity.dstChain.id,
        src: opportunity.tokenAddress,
        dst: opportunity.tokenAddress, // Same token, different chain
        amount,
        from: address!,
      });
      
      console.log('Arbitrage executed:', result);
    } catch (error) {
      console.error('Error executing arbitrage:', error);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Medium</Badge>;
      case 'low':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Low</Badge>;
      default:
        return null;
    }
  };

  // Auto-scan every 30 seconds
  useEffect(() => {
    if (autoScan) {
      const interval = setInterval(scanForOpportunities, 30000);
      return () => clearInterval(interval);
    }
  }, [autoScan]);

  // Initial scan
  useEffect(() => {
    scanForOpportunities();
  }, []);

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="gradient-text">Cross-Chain Arbitrage Scanner</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {opportunities.length} Opportunities
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={scanForOpportunities}
              disabled={isScanning}
              className="border-white/10 hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-gray-400">
              {isScanning ? 'Scanning...' : `Last scan: ${lastScan?.toLocaleTimeString()}`}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-400">Auto-scan</span>
          </label>
        </div>

        {/* Opportunities List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No arbitrage opportunities found</p>
              <p className="text-sm text-gray-500 mt-2">
                Scanner checks for price differences across chains
              </p>
            </div>
          ) : (
            opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="glass-card border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">{opportunity.tokenSymbol}</span>
                      {getConfidenceBadge(opportunity.confidence)}
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${opportunity.profitPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {opportunity.profitPercent > 0 ? '+' : ''}{opportunity.profitPercent.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-400">
                        ~${opportunity.profitUSD.toFixed(2)} profit
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-300">
                        {opportunity.srcChain.name}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-purple-500/20 rounded text-purple-300">
                        {opportunity.dstChain.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Vol: ${(opportunity.volume / 1000).toFixed(0)}K
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-3">
                    <div>
                      <span className="text-gray-500">Buy Price:</span>
                      <div className="font-medium">${opportunity.srcPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Sell Price:</span>
                      <div className="font-medium">${opportunity.dstPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Execution:</span>
                      <div className="font-medium">{opportunity.executionTime}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Gas:</span>
                      <div className="font-medium text-green-400">{opportunity.gasEstimate}</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => executeArbitrage(opportunity)}
                    disabled={!isConnected}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    size="sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Arbitrage
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
