'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletConnect } from '@/components/wallet-connect';
import { useAccount } from 'wagmi';
import { 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Users,
  DollarSign,
  BarChart3,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  const { isConnected } = useAccount();
  const [showDemo, setShowDemo] = useState(false);

  // If user is connected, redirect to swap app
  if (isConnected) {
    window.location.href = '/swap';
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/10" />

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
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowDemo(true)}
              >
                Demo
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <div className="space-y-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                The Future of DeFi Trading
              </Badge>
              
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                  <span className="text-foreground">
                    Trade Smarter,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Never Overpay
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Nexus intelligently routes your trades across all DeFi protocols, 
                  protects you from MEV attacks, and ensures you always get the best price.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletConnect />
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowDemo(true)}
              >
                Watch Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-border/50">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-foreground">$2.5B+</div>
                <div className="text-sm text-muted-foreground">Volume Traded</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">DEX Sources</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-foreground">5</div>
                <div className="text-sm text-muted-foreground">Blockchains</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-bold text-foreground">
                Why Choose Nexus?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The most advanced DeFi aggregator with features that save you money on every trade
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-border/40 hover:border-border/60 transition-all duration-300 group shadow-sm shadow-black/5 bg-gradient-to-br from-card/50 to-card/30">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      MEV Protection
                    </CardTitle>
                    <CardDescription>
                      Built-in protection against sandwich attacks and MEV extraction
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Save hundreds of dollars on every trade with automatic MEV protection.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">$500M+ in MEV attacks prevented</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/40 hover:border-border/60 transition-all duration-300 group shadow-sm shadow-black/5 bg-gradient-to-br from-card/50 to-card/30">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Cross-Chain Native
                    </CardTitle>
                    <CardDescription>
                      Trade across 5 blockchains without bridges
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Fusion+ technology makes cross-chain trading seamless and secure.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-muted-foreground">Bridge-free cross-chain swaps</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/40 hover:border-border/60 transition-all duration-300 group shadow-sm shadow-black/5 bg-gradient-to-br from-card/50 to-card/30">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Best Prices Always
                    </CardTitle>
                    <CardDescription>
                      AI-powered routing across 500+ DEXs
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Never leave money on the table with intelligent price optimization.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Up to 42% better rates</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <span className="text-muted-foreground ml-2">Trusted by 50,000+ traders</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">50K+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">$847M</div>
                <div className="text-muted-foreground">Saved in Fees</div>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">98.7%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <Card className="border-border/30 p-12 text-center shadow-lg shadow-black/5 bg-gradient-to-br from-card/40 to-card/20">
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-foreground">
                    Ready to Trade Smarter?
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Join thousands of traders who never overpay for swaps
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <WalletConnect />
                  <Button 
                    variant="outline" 
                    size="lg"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Nexus
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              The convergence point where all DeFi protocols unite
            </p>
            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
              <span>© 2024 Nexus</span>
              <span>•</span>
              <span>Built with Next.js</span>
              <span>•</span>
              <span>Powered by 1inch</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}