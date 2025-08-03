'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3, Activity } from 'lucide-react';
import { useAccount } from 'wagmi';

interface PortfolioToken {
  symbol: string;
  name: string;
  balance: string;
  usd_value: number;
  usd_value_24hr_usd_change: number;
  portfolio_percentage: number;
  price_24hr_percent_change: number;
}

export function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioToken[]>([]);
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useAccount();

  // Mock portfolio data for demo
  const mockPortfolio: PortfolioToken[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '12.5',
      usd_value: 24567.89,
      usd_value_24hr_usd_change: 456.78,
      portfolio_percentage: 65.2,
      price_24hr_percent_change: 2.3
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '8,450.0',
      usd_value: 8450.00,
      usd_value_24hr_usd_change: 0.00,
      portfolio_percentage: 22.4,
      price_24hr_percent_change: 0.0
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      balance: '245.6',
      usd_value: 2456.78,
      usd_value_24hr_usd_change: -123.45,
      portfolio_percentage: 6.5,
      price_24hr_percent_change: -4.8
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      balance: '156.8',
      usd_value: 2234.56,
      usd_value_24hr_usd_change: 67.89,
      portfolio_percentage: 5.9,
      price_24hr_percent_change: 3.1
    }
  ];

  useEffect(() => {
    if (isConnected) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPortfolio(mockPortfolio);
        setLoading(false);
      }, 1000);
    }
  }, [isConnected]);

  // Memoized calculations for better performance
  const portfolioMetrics = useMemo(() => {
    const totalValue = portfolio.reduce((sum, token) => sum + token.usd_value, 0);
    const totalChange24h = portfolio.reduce((sum, token) => sum + token.usd_value_24hr_usd_change, 0);
    const changePercentage = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;
    const bestPerformer = portfolio.length > 0 ? 
      portfolio.reduce((best, token) => 
        token.price_24hr_percent_change > best.price_24hr_percent_change ? token : best
      ) : null;

    return {
      totalValue,
      totalChange24h,
      changePercentage,
      bestPerformer,
      assetCount: portfolio.length
    };
  }, [portfolio]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground text-center">
            Connect your wallet to view your portfolio and track your assets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all duration-500 animate-in slide-in-from-bottom-2">
              ${portfolioMetrics.totalValue.toLocaleString()}
            </div>
            <div className={`text-xs flex items-center gap-1 transition-all duration-300 ${
              portfolioMetrics.changePercentage >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {portfolioMetrics.changePercentage >= 0 ? 
                <TrendingUp className="h-3 w-3 animate-pulse" /> : 
                <TrendingDown className="h-3 w-3 animate-pulse" />
              }
              <span className="transition-all duration-500">
                {Math.abs(portfolioMetrics.changePercentage).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Change</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold transition-all duration-500 animate-in slide-in-from-bottom-2 ${
              portfolioMetrics.totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              ${portfolioMetrics.totalChange24h >= 0 ? '+' : ''}${portfolioMetrics.totalChange24h.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground transition-opacity duration-300">
              Last 24 hours
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioMetrics.assetCount}</div>
            <div className="text-xs text-muted-foreground">
              Different tokens
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioMetrics.bestPerformer?.symbol || '--'}
            </div>
            <div className="text-xs text-green-500">
              {portfolioMetrics.bestPerformer ? 
                `+${portfolioMetrics.bestPerformer.price_24hr_percent_change.toFixed(1)}%` : '--'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Your Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted/40" />
                      <div className="space-y-2">
                        <div className="h-4 w-16 bg-muted/40 rounded" />
                        <div className="h-3 w-24 bg-muted/30 rounded" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-4 w-20 bg-muted/40 rounded" />
                      <div className="h-3 w-12 bg-muted/30 rounded" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 w-24 bg-muted/40 rounded" />
                      <div className="h-3 w-16 bg-muted/30 rounded" />
                    </div>
                    <div className="h-6 w-12 bg-muted/40 rounded-full" />
                  </div>
                ))}
              </div>
            ) : portfolio.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No assets found in your portfolio</p>
              </div>
            ) : (
              portfolio.map((token, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-all duration-300 hover:shadow-md animate-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-border/30">
                        <span className="font-bold text-sm">{token.symbol}</span>
                      </div>
                      {/* Portfolio percentage indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-border/50 flex items-center justify-center">
                        <div 
                          className="w-2 h-2 rounded-full bg-primary"
                          style={{ 
                            opacity: Math.min(token.portfolio_percentage / 50, 1),
                            transform: `scale(${Math.max(0.5, token.portfolio_percentage / 100)})`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate">{token.name}</div>
                      {/* Portfolio allocation bar */}
                      <div className="mt-1 w-full bg-muted/30 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/60 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(token.portfolio_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-right flex-1">
                    <div>
                      <div className="font-medium text-sm">{token.balance}</div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                    
                    <div>
                      <div className="font-bold">${token.usd_value.toLocaleString()}</div>
                      <div className="flex items-center justify-end gap-1">
                        <div className={`text-xs flex items-center gap-1 ${
                          token.price_24hr_percent_change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {token.price_24hr_percent_change >= 0 ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                          }
                          {Math.abs(token.price_24hr_percent_change).toFixed(1)}%
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0.5 ml-2"
                          style={{ 
                            backgroundColor: `hsl(var(--primary) / ${token.portfolio_percentage / 100 * 0.2})`,
                            color: 'hsl(var(--foreground))'
                          }}
                        >
                          {token.portfolio_percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <div className="font-medium">Swap ETH → USDC</div>
                  <div className="text-sm text-muted-foreground">2 hours ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">1.5 ETH</div>
                <div className="text-sm text-muted-foreground">$2,847.50</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Received UNI</div>
                  <div className="text-sm text-muted-foreground">1 day ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">45.6 UNI</div>
                <div className="text-sm text-muted-foreground">$456.78</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium">Swap USDC → LINK</div>
                  <div className="text-sm text-muted-foreground">3 days ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">1,200 USDC</div>
                <div className="text-sm text-muted-foreground">$1,200.00</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
