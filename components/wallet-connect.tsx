'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SUPPORTED_CHAINS } from '@/lib/web3'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const currentChain = chain && SUPPORTED_CHAINS[chain.id as keyof typeof SUPPORTED_CHAINS]

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="px-4 py-2"
          >
            <div className="flex items-center gap-3">
              {currentChain && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: currentChain.color }}
                  />
                  <span className="text-xs font-medium">
                    {currentChain.name}
                  </span>
                </div>
              )}
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="font-mono text-sm font-medium">
                  {formatAddress(address)}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-slate-900/95 border-slate-800/50 backdrop-blur-xl rounded-2xl p-2 shadow-2xl min-w-[200px]"
        >
          <div className="px-3 py-2 border-b border-slate-800/50 mb-2">
            <div className="text-xs text-slate-400 mb-1">Connected Account</div>
            <div className="font-mono text-sm text-white">{formatAddress(address)}</div>
          </div>
          <DropdownMenuItem 
            onClick={() => disconnect()}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="font-semibold">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <div className="px-3 py-2 border-b border-border mb-2">
          <div className="text-xs text-muted-foreground mb-1">Choose Wallet</div>
          <div className="text-sm text-foreground">Connect to start trading</div>
        </div>
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => connect({ connector })}
            className="cursor-pointer py-3 px-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">{connector.name}</div>
                <div className="text-xs text-muted-foreground">Connect using {connector.name}</div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
