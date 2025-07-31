'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpDown, Settings, Zap } from 'lucide-react'
import { TokenSelector } from './token-selector'
import { Token, QuoteResponse, oneInchService } from '@/lib/1inch'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { NATIVE_TOKENS } from '@/lib/web3'
import toast from 'react-hot-toast'
import { parseEther, formatEther } from 'viem'

export function SwapInterface() {
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [slippage, setSlippage] = useState(1)
  
  const { address, chain } = useAccount()
  const { sendTransaction, data: hash, isPending } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const chainId = chain?.id || 1

  useEffect(() => {
    // Set default tokens
    const nativeToken = {
      address: NATIVE_TOKENS[chainId as keyof typeof NATIVE_TOKENS],
      symbol: chainId === 1 ? 'ETH' : chainId === 137 ? 'MATIC' : 'ETH',
      name: chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : 'Ethereum',
      decimals: 18,
    }
    setFromToken(nativeToken)
  }, [chainId])

  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      getQuote()
    } else {
      setToAmount('')
      setQuote(null)
    }
  }, [fromToken, toToken, fromAmount])

  const getQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return

    setLoading(true)
    try {
      const amount = oneInchService.formatAmount(fromAmount, fromToken.decimals)
      const quoteData = await oneInchService.getQuote(
        chainId,
        fromToken.address,
        toToken.address,
        amount
      )
      setQuote(quoteData)
      setToAmount(oneInchService.parseAmount(quoteData.dstAmount, toToken.decimals))
    } catch (error) {
      console.error('Failed to get quote:', error)
      toast.error('Failed to get quote')
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!address || !fromToken || !toToken || !fromAmount || !quote) {
      toast.error('Please connect wallet and select tokens')
      return
    }

    try {
      const amount = oneInchService.formatAmount(fromAmount, fromToken.decimals)
      const swapData = await oneInchService.getSwap(
        chainId,
        fromToken.address,
        toToken.address,
        amount,
        address,
        slippage
      )

      await sendTransaction({
        to: swapData.tx.to as `0x${string}`,
        data: swapData.tx.data as `0x${string}`,
        value: BigInt(swapData.tx.value),
        gas: BigInt(swapData.tx.gas),
      })

      toast.success('Swap transaction sent!')
    } catch (error) {
      console.error('Swap failed:', error)
      toast.error('Swap failed')
    }
  }

  const handleFlipTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount('')
  }

  const isSwapDisabled = !address || !fromToken || !toToken || !fromAmount || loading || isPending || isConfirming

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="relative bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 rounded-2xl blur-xl opacity-30" />
        
        <CardHeader className="relative pb-6">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Swap
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
          
          {/* Chain indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">
              {chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : 'Ethereum'} Network
            </span>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-6 p-6">
          {/* From Token */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">From</label>
              {fromToken && (
                <div className="text-xs text-slate-400">
                  Balance: <span className="text-slate-300 font-medium">0.00</span>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl blur-sm" />
              <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="bg-transparent border-none text-white text-2xl font-bold placeholder:text-slate-500 p-0 h-auto focus:ring-0 focus:outline-none"
                    />
                    {fromToken && fromAmount && (
                      <div className="text-sm text-slate-400 mt-1">
                        ~$0.00
                      </div>
                    )}
                  </div>
                  <TokenSelector
                    selectedToken={fromToken}
                    onTokenSelect={setFromToken}
                    label="token"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center relative">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlipTokens}
              className="relative rounded-full p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 backdrop-blur-sm hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <ArrowUpDown className="w-5 h-5 text-slate-300" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">To</label>
              {toToken && (
                <div className="text-xs text-slate-400">
                  Balance: <span className="text-slate-300 font-medium">0.00</span>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl blur-sm" />
              <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={toAmount}
                      readOnly
                      className="bg-transparent border-none text-white text-2xl font-bold placeholder:text-slate-500 p-0 h-auto focus:ring-0 focus:outline-none"
                    />
                    {toToken && toAmount && (
                      <div className="text-sm text-slate-400 mt-1">
                        ~$0.00
                      </div>
                    )}
                  </div>
                  <TokenSelector
                    selectedToken={toToken}
                    onTokenSelect={setToToken}
                    label="token"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quote Info */}
          {quote && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl blur-sm" />
              <div className="relative bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 backdrop-blur-sm space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-slate-300">Best Route Found</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Exchange Rate</span>
                    <span className="text-slate-200 font-medium">
                      1 {fromToken?.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken?.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Network Fee</span>
                    <span className="text-slate-200 font-medium">
                      {formatEther(BigInt(quote.gas))} ETH
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Max Slippage</span>
                    <span className="text-slate-200 font-medium">{slippage}%</span>
                  </div>
                  
                  <div className="border-t border-slate-700/50 pt-2 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Price Impact</span>
                      <span className="text-green-400 font-medium">&lt; 0.01%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-lg opacity-50" />
            <Button
              onClick={handleSwap}
              disabled={isSwapDisabled}
              className="relative w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-semibold text-lg shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02]"
            >
              {isPending || isConfirming ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>{isPending ? 'Confirming Transaction...' : 'Processing Swap...'}</span>
                </div>
              ) : !address ? (
                'Connect Wallet to Swap'
              ) : loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
                  <span>Finding Best Route...</span>
                </div>
              ) : (
                'Swap Tokens'
              )}
            </Button>
          </div>

          {isSuccess && (
            <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-2xl">
              <div className="text-green-400 text-sm font-medium">
                ✓ Swap completed successfully!
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
