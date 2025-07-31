'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WalletConnect } from '@/components/wallet-connect'
import { SwapInterface } from '@/components/swap-interface';
import AdvancedSwapInterface from '@/components/advanced-swap-interface';
import LimitOrdersDashboard from '@/components/limit-orders-dashboard';
import { PortfolioDashboard } from '@/components/portfolio-dashboard';
import { Activity, BarChart3, Repeat, TrendingUp, Zap, Shield, Layers, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      
      {/* Header */}
      <header className="relative border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/30 supports-[backdrop-filter]:bg-slate-950/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 blur-md opacity-30 -z-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                  1inch DEX
                </h1>
                <p className="text-xs text-slate-400 font-medium">Advanced DeFi Trading</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
                Next-Gen DeFi
                <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Trading Platform
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Experience the future of decentralized trading with advanced aggregation, 
                real-time analytics, and seamless multi-chain support
              </p>
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 pt-8 border-t border-slate-800/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">$2.5B+</div>
                <div className="text-sm text-slate-400">Volume Traded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-slate-400">DEX Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-sm text-slate-400">Blockchains</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
              <CardContent className="p-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Repeat className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Best Rates</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Aggregated liquidity across 50+ DEXs for optimal pricing</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
              <CardContent className="p-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Portfolio Tracking</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Real-time analytics and performance insights</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
              <CardContent className="p-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Multi-Chain</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Ethereum, Polygon, Arbitrum, Optimism & Base</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10">
              <CardContent className="p-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Secure & Fast</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Gas optimized with MEV protection</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Interface */}
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="swap" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-1 rounded-2xl">
                  <TabsTrigger 
                    value="swap" 
                    className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-slate-400 hover:text-slate-200"
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    Swap
                  </TabsTrigger>
                  <TabsTrigger 
                    value="portfolio" 
                    className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-slate-400 hover:text-slate-200"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Portfolio
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="swap" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <SwapInterface />
                  <AdvancedSwapInterface />
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <PortfolioDashboard />
                  </div>
                  <div>
                    <LimitOrdersDashboard />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 backdrop-blur-xl bg-slate-950/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                1inch DEX
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Advanced DeFi trading platform powered by 1inch API aggregation
            </p>
            <div className="flex justify-center gap-6 text-xs text-slate-500">
              <span>© 2024 1inch DEX</span>
              <span>•</span>
              <span>Built with Next.js</span>
              <span>•</span>
              <span>Powered by 1inch API</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}