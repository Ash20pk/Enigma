'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, X, CheckCircle, AlertCircle } from 'lucide-react';
import { oneInchService } from '@/lib/1inch';

interface LimitOrder {
  orderHash: string;
  status: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  maker: string;
  createdAt: string;
  filledMakingAmount?: string;
  filledTakingAmount?: string;
}

export default function LimitOrdersDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'filled' | 'cancelled'>('active');

  useEffect(() => {
    if (isConnected && address) {
      fetchOrders();
    }
  }, [isConnected, address, chainId, activeTab]);

  const fetchOrders = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const statusFilter = activeTab === 'active' ? '1' : activeTab === 'filled' ? '2' : '3';
      const result = await oneInchService.getLimitOrders(chainId, {
        maker: address,
        statuses: statusFilter,
        limit: 50,
      });
      setOrders(result.orders || []);
    } catch (error) {
      console.error('Error fetching limit orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      '1': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock, label: 'Active' },
      '2': { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle, label: 'Filled' },
      '3': { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: X, label: 'Cancelled' },
      '4': { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: AlertCircle, label: 'Expired' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['1'];
    const Icon = statusInfo.icon;
    
    return (
      <Badge className={`${statusInfo.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(6);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const calculateProgress = (order: LimitOrder) => {
    if (!order.filledMakingAmount) return 0;
    const filled = parseFloat(order.filledMakingAmount);
    const total = parseFloat(order.makingAmount);
    return (filled / total) * 100;
  };

  const OrderCard = ({ order }: { order: LimitOrder }) => {
    const progress = calculateProgress(order);
    
    return (
      <Card className="glass-card border-white/10 hover:border-white/20 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {formatAddress(order.makerAsset)} → {formatAddress(order.takerAsset)}
              </span>
            </div>
            {getStatusBadge(order.status)}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Making Amount:</span>
              <span>{formatAmount(order.makingAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Taking Amount:</span>
              <span>{formatAmount(order.takingAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rate:</span>
              <span>
                {(parseFloat(order.takingAmount) / parseFloat(order.makingAmount)).toFixed(6)}
              </span>
            </div>
            {order.filledMakingAmount && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress:</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
              <span>Hash: {formatAddress(order.orderHash)}</span>
            </div>
          </div>
          
          {order.status === '1' && (
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/20"
              >
                Cancel Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span className="gradient-text">Limit Orders</span>
          </div>
          <Button 
            onClick={fetchOrders}
            size="sm"
            variant="outline"
            className="border-white/10 hover:bg-white/5"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5 mb-6">
            <TabsTrigger value="active" className="data-[state=active]:bg-yellow-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="filled" className="data-[state=active]:bg-green-500/20">
              <CheckCircle className="w-4 h-4 mr-2" />
              Filled
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-red-500/20">
              <X className="w-4 h-4 mr-2" />
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading active orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No active limit orders</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create your first limit order to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.orderHash} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="filled" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading filled orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No filled orders</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.orderHash} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading cancelled orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <X className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No cancelled orders</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.orderHash} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
