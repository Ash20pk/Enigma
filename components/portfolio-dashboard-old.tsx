'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3 } from 'lucide-react'
import { PortfolioToken, oneInchService } from '@/lib/1inch'
import { useAccount } from 'wagmi'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioToken[]>([])
  const [loading, setLoading] = useState(false)
  const { address } = useAccount()

  useEffect(() => {
    if (address) {
      loadPortfolio()
    }
  }, [address])

  const loadPortfolio = async () => {
    if (!address) return

    setLoading(true)
    try {
      const portfolioData = await oneInchService.getPortfolio([address])
      setPortfolio(portfolioData)
    } catch (error) {
      console.error('Failed to load portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalValue = portfolio.reduce((sum, token) => sum + token.usd_value, 0)
  const totalChange24h = portfolio.reduce((sum, token) => sum + token.usd_value_24hr_usd_change, 0)
  const changePercentage = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0

  const pieData = portfolio
    .filter(token => token.usd_value > 0.01) // Filter out dust
    .map(token => ({
      name: token.symbol,
      value: token.usd_value,
      percentage: token.portfolio_percentage,
    }))

  const barData = portfolio
    .filter(token => token.usd_value > 0.01)
    .slice(0, 10) // Top 10 tokens
    .map(token => ({
      symbol: token.symbol,
      value: token.usd_value,
      change: token.usd_price_24hr_percent_change,
    }))

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16', '#F97316', '#06B6D4']

  if (!address) {
    return (
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">Connect your wallet to view portfolio</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <div className={`text-xs flex items-center gap-1 ${
              changePercentage >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {changePercentage >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(changePercentage).toFixed(2)}% (${totalChange24h.toFixed(2)})
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300">
          <div className={`absolute inset-0 ${changePercentage >= 0 ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5' : 'bg-gradient-to-r from-red-500/5 to-rose-500/5'} rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl ${changePercentage >= 0 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-r from-red-500/20 to-rose-500/20'} flex items-center justify-center`}>
                {changePercentage >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              24h Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-3xl font-bold ${changePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {changePercentage >= 0 ? '+' : ''}
              {changePercentage.toFixed(2)}%
            </div>
            <div className={`text-sm ${changePercentage >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`}>
              ${totalChange24h >= 0 ? '+' : ''}
              {totalChange24h.toFixed(2)} USD
            </div>
          </CardContent>
        </Card>

        <Card className="group relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              Active Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {portfolio.filter(token => token.usd_value > 0.01).length}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Tokens in portfolio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Details */}
      <Tabs defaultValue="tokens" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-1 rounded-2xl">
            <TabsTrigger 
              value="tokens" 
              className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-slate-400 hover:text-slate-200"
            >
              Tokens
            </TabsTrigger>
            <TabsTrigger 
              value="allocation" 
              className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-slate-400 hover:text-slate-200"
            >
              Allocation
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-slate-400 hover:text-slate-200"
            >
              Performance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tokens">
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Token Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolio.filter(token => token.usd_value > 0.01).map((token) => (
                    <div key={token.token_address} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-sm text-slate-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          ${token.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-slate-400">
                          {parseFloat(token.balance_formatted).toFixed(4)} {token.symbol}
                        </div>
                        <div className={`text-sm ${token.usd_price_24hr_percent_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.usd_price_24hr_percent_change >= 0 ? '+' : ''}
                          {token.usd_price_24hr_percent_change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {portfolio.filter(token => token.usd_value > 0.01).length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-400">
                      No tokens found in portfolio
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <p className="text-white font-medium">{data.name}</p>
                              <p className="text-slate-300">${data.value.toFixed(2)}</p>
                              <p className="text-slate-400">{data.percentage.toFixed(1)}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">24h Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="symbol" tick={{ fill: '#94a3b8' }} />
                    <YAxis tick={{ fill: '#94a3b8' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <p className="text-white font-medium">{label}</p>
                              <p className="text-slate-300">Value: ${data.value.toFixed(2)}</p>
                              <p className={`${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Change: {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="change" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
