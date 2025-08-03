'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WalletConnect } from '@/components/wallet-connect';
import FusionSwapAggregator from '@/components/fusion-swap-aggregator';
import { Zap, Settings, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioDashboard } from '@/components/portfolio-dashboard';

export default function SwapPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect to landing page if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/10" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Nexus
                </h1>
                <p className="text-xs text-muted-foreground">Fusion Intent Swaps</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="swap" className="space-y-6 sm:space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-11 sm:h-10">
              <TabsTrigger 
                value="swap" 
                className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Swap</span>
                <span className="sm:hidden">Trade</span>
              </TabsTrigger>
              <TabsTrigger 
                value="portfolio" 
                className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4" />
                Portfolio
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="swap" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <FusionSwapAggregator />
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <PortfolioDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Nexus
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              The convergence point where all DeFi protocols unite
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
