'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, TrendingUp, Zap, Eye, DollarSign } from 'lucide-react';

interface MEVStats {
  totalSaved: number;
  sandwichAttacksPrevented: number;
  frontrunningBlocked: number;
  protectionRate: number;
  lastWeekSavings: number;
  fusionUsagePercent: number;
}

interface MEVAlert {
  id: string;
  type: 'sandwich' | 'frontrun' | 'backrun';
  severity: 'high' | 'medium' | 'low';
  tokenPair: string;
  potentialLoss: number;
  timestamp: Date;
  prevented: boolean;
}

export default function MEVProtectionDashboard() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<MEVStats>({
    totalSaved: 2847.32,
    sandwichAttacksPrevented: 23,
    frontrunningBlocked: 15,
    protectionRate: 98.7,
    lastWeekSavings: 156.78,
    fusionUsagePercent: 87.3
  });
  
  const [alerts, setAlerts] = useState<MEVAlert[]>([
    {
      id: '1',
      type: 'sandwich',
      severity: 'high',
      tokenPair: 'ETH/USDC',
      potentialLoss: 45.67,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      prevented: true
    },
    {
      id: '2',
      type: 'frontrun',
      severity: 'medium',
      tokenPair: 'WBTC/ETH',
      potentialLoss: 23.45,
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      prevented: true
    },
    {
      id: '3',
      type: 'backrun',
      severity: 'low',
      tokenPair: 'UNI/USDT',
      potentialLoss: 8.92,
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      prevented: false
    }
  ]);

  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [autoFusion, setAutoFusion] = useState(true);

  const getMEVTypeIcon = (type: string) => {
    switch (type) {
      case 'sandwich': return AlertTriangle;
      case 'frontrun': return TrendingUp;
      case 'backrun': return Eye;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Protection Status */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="gradient-text">MEV Protection Status</span>
            </div>
            <Badge className={`${protectionEnabled ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
              {protectionEnabled ? '🛡️ Protected' : '⚠️ Vulnerable'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">${stats.totalSaved.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.protectionRate}%</div>
              <div className="text-sm text-gray-400">Protection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.sandwichAttacksPrevented}</div>
              <div className="text-sm text-gray-400">Attacks Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.fusionUsagePercent}%</div>
              <div className="text-sm text-gray-400">Fusion Usage</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectionEnabled}
                  onChange={(e) => setProtectionEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">Enable MEV Protection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFusion}
                  onChange={(e) => setAutoFusion(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">Auto-route via Fusion</span>
              </label>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">This Week Saved</div>
              <div className="text-lg font-bold text-green-400">${stats.lastWeekSavings.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MEV Alerts */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="gradient-text">Recent MEV Activity</span>
            </div>
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              {alerts.filter(a => a.prevented).length}/{alerts.length} Blocked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getMEVTypeIcon(alert.type);
              
              return (
                <Card key={alert.id} className="glass-card border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium capitalize">{alert.type} Attack</span>
                        <Badge className={`text-xs ${getSeverityColor(alert.severity)} border`}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.prevented ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            ✅ Blocked
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                            ❌ Not Blocked
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Pair:</span>
                        <div className="font-medium">{alert.tokenPair}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Potential Loss:</span>
                        <div className="font-medium text-red-400">${alert.potentialLoss.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <div className="font-medium">{formatTimeAgo(alert.timestamp)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Protection Methods */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="gradient-text">Protection Methods</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-card border-white/10">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-medium mb-2">Fusion Protocol</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Intent-based execution with built-in MEV protection
                </p>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Primary Defense
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-white/10">
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-medium mb-2">Private Mempool</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Transactions hidden from public mempool
                </p>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Active
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-white/10">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-medium mb-2">Smart Routing</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Automatic protocol selection based on MEV risk
                </p>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  AI-Powered
                </Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
