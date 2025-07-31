'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, Search } from 'lucide-react'
import { Token, oneInchService } from '@/lib/1inch'
import { POPULAR_TOKENS } from '@/lib/web3'
import { useAccount } from 'wagmi'

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenSelect: (token: Token) => void
  label: string
}

export function TokenSelector({ selectedToken, onTokenSelect, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)
  const { chain } = useAccount()

  const chainId = chain?.id || 1

  useEffect(() => {
    if (isOpen && tokens.length === 0) {
      loadTokens()
    }
  }, [isOpen, chainId])

  const loadTokens = async () => {
    setLoading(true)
    try {
      const tokenData = await oneInchService.getTokens(chainId)
      const tokenList = Object.values(tokenData)
      
      // Add popular tokens first
      const popularTokens = POPULAR_TOKENS[chainId as keyof typeof POPULAR_TOKENS] || []
      const allTokens = [...popularTokens, ...tokenList.filter(token => 
        !popularTokens.some(popular => popular.address.toLowerCase() === token.address.toLowerCase())
      )]
      
      setTokens(allTokens)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      // Fallback to popular tokens
      setTokens(POPULAR_TOKENS[chainId as keyof typeof POPULAR_TOKENS] || [])
    } finally {
      setLoading(false)
    }
  }

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
        >
          <div className="flex items-center gap-2">
            {selectedToken ? (
              <>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                  {selectedToken.symbol.charAt(0)}
                </div>
                <span className="text-white">{selectedToken.symbol}</span>
              </>
            ) : (
              <span className="text-slate-400">Select {label}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Select {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
            />
          </div>
          <ScrollArea className="h-80">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-sm text-slate-400 truncate">{token.name}</div>
                    </div>
                  </button>
                ))}
                {filteredTokens.length === 0 && !loading && (
                  <div className="text-center py-8 text-slate-400">
                    No tokens found
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
