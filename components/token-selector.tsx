'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { POPULAR_TOKENS, SUPPORTED_CHAINS } from '@/lib/web3'
import { useAccount, useSwitchChain } from 'wagmi'

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenSelect: (token: Token) => void
  label: string
}

export function TokenSelector({ selectedToken, onTokenSelect, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tokens, setTokens] = useState<Record<number, Token[]>>({})
  const [loading, setLoading] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number>(1)
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()

  const chainId = chain?.id || 1
  const supportedChainIds = Object.keys(SUPPORTED_CHAINS).map(Number)

  useEffect(() => {
    setSelectedChainId(chainId)
  }, [chainId])

  useEffect(() => {
    if (isOpen) {
      loadTokensForChain(selectedChainId)
    }
  }, [isOpen, selectedChainId])

  const loadTokensForChain = async (targetChainId: number) => {
    if (tokens[targetChainId]) return // Already loaded
    
    setLoading(true)
    try {
      const tokenData = await oneInchService.getTokens(targetChainId)
      const tokenList = Object.values(tokenData)
      
      // Add popular tokens first
      const popularTokens = POPULAR_TOKENS[targetChainId as keyof typeof POPULAR_TOKENS] || []
      const allTokens = [...popularTokens, ...tokenList.filter(token => 
        !popularTokens.some(popular => popular.address.toLowerCase() === token.address.toLowerCase())
      )]
      
      setTokens(prev => ({ ...prev, [targetChainId]: allTokens }))
    } catch (error) {
      console.error('Failed to load tokens:', error)
      // Fallback to popular tokens
      const popularTokens = POPULAR_TOKENS[targetChainId as keyof typeof POPULAR_TOKENS] || []
      setTokens(prev => ({ ...prev, [targetChainId]: popularTokens }))
    } finally {
      setLoading(false)
    }
  }

  const currentChainTokens = tokens[selectedChainId] || []
  
  const filteredTokens = currentChainTokens.filter((token: Token) =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleChainSelect = async (newChainId: number) => {
    setSelectedChainId(newChainId)
    if (newChainId !== chainId && switchChain) {
      try {
        await switchChain({ chainId: newChainId })
      } catch (error) {
        console.error('Failed to switch chain:', error)
      }
    }
    loadTokensForChain(newChainId)
  }

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
          className="w-full justify-between bg-white/90 backdrop-blur-sm border-2 border-border/40 hover:border-border/60 transition-all duration-300 h-12 rounded-xl shadow-sm hover:shadow-md hover:bg-white"
        >
          <div className="flex items-center gap-3">
            {selectedToken ? (
              <>
                {selectedToken.logoURI ? (
                  <img 
                    src={selectedToken.logoURI} 
                    alt={selectedToken.symbol} 
                    className="w-6 h-6 rounded-full border border-border/30"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-border/30 flex items-center justify-center text-xs font-medium ${selectedToken.logoURI ? 'hidden' : ''}`}>
                  {selectedToken.symbol.charAt(0)}
                </div>
                <span className="font-medium text-foreground">{selectedToken.symbol}</span>
              </>
            ) : (
              <span className="text-muted-foreground font-light">Select {label}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:rotate-180" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-background to-background/95 border-border/40 max-w-lg shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-light tracking-wide">Select Token</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Chain Selector */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground tracking-wide">Select Network</div>
            <div className="flex flex-wrap gap-2">
              {supportedChainIds.map((id) => {
                const chainInfo = SUPPORTED_CHAINS[id as keyof typeof SUPPORTED_CHAINS]
                return (
                  <Button
                    key={id}
                    variant={selectedChainId === id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChainSelect(id)}
                    className={`flex items-center gap-2 transition-all duration-300 rounded-lg border-border/40 ${
                      selectedChainId === id 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-foreground hover:bg-muted/50 hover:border-border/60'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full border border-border/30" 
                      style={{ backgroundColor: chainInfo.color }}
                    />
                    <span className="font-medium">{chainInfo.name}</span>
                    {id === chainId && (
                      <Badge variant="secondary" className="text-xs bg-muted/50 text-foreground">
                        Current
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-sm border-2 border-border/40 rounded-xl focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder:text-muted-foreground/50"
              aria-label="Search for tokens by name, symbol, or address"
              role="searchbox"
            />
          </div>


          <ScrollArea className="h-80">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="font-light">Loading tokens...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTokens.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-lg font-light">No tokens found</div>
                    <div className="text-sm mt-1">Try a different search term</div>
                  </div>
                ) : (
                  filteredTokens.map((token: Token) => (
                    <button
                      key={token.address}
                      onClick={() => handleTokenSelect(token)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-all duration-200 text-left border border-transparent hover:border-border/30 hover:shadow-sm group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label={`Select ${token.symbol} (${token.name})`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTokenSelect(token);
                        }
                      }}
                    >
                      <div className="relative">
                        {token.logoURI ? (
                          <img 
                            src={token.logoURI} 
                            alt={token.symbol} 
                            className="w-10 h-10 rounded-full border border-border/30"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-border/30 flex items-center justify-center text-sm font-medium text-foreground ${token.logoURI ? 'hidden' : ''}`}>
                          {token.symbol.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {token.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {token.name}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ChevronDown className="w-4 h-4 text-muted-foreground rotate-270" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
