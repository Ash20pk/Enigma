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
            className="relative bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-800/60 backdrop-blur-xl rounded-2xl px-4 py-2 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl" />
            <div className="relative flex items-center gap-3">
              {currentChain && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse shadow-sm" 
                    style={{ backgroundColor: currentChain.color }}
                  />
                  <span className="text-xs font-medium text-slate-300">
                    {currentChain.name}
                  </span>
                </div>
              )}
              <div className="w-px h-4 bg-slate-600" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-purple-400" />
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
        <Button className="relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl px-6 py-2 font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/25">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30" />
          <div className="relative flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="w-3 h-3" />
            </div>
            Connect Wallet
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-slate-900/95 border-slate-800/50 backdrop-blur-xl rounded-2xl p-2 shadow-2xl min-w-[200px]"
      >
        <div className="px-3 py-2 border-b border-slate-800/50 mb-2">
          <div className="text-xs text-slate-400 mb-1">Choose Wallet</div>
          <div className="text-sm text-slate-300">Connect to start trading</div>
        </div>
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => connect({ connector })}
            className="text-white hover:bg-slate-800/50 rounded-xl transition-colors duration-200 cursor-pointer py-3 px-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="font-medium">{connector.name}</div>
                <div className="text-xs text-slate-400">Connect using {connector.name}</div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
