"use client"

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, AlertCircle, CheckCircle, ExternalLink, Copy } from "lucide-react"
import { useWeb3 } from "@/contexts/Web3Context"
import { toast } from "sonner"

export function MetaMaskConnector() {
  const { 
    account, 
    isConnected, 
    balance, 
    chainId, 
    connectWallet, 
    disconnectWallet, 
    switchToAmoyNetwork,
    loading, 
    error 
  } = useWeb3()

  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account)
      setCopied(true)
      toast.success("Address copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return "Ethereum Mainnet"
      case 137: return "Polygon Mainnet"
      case 80001: return "Polygon Mumbai"
      case 80002: return "Polygon Amoy"
      case 11155111: return "Sepolia Testnet"
      case 31337: return "Localhost (Hardhat)"
      default: return `Chain ID: ${chainId}`
    }
  }

  const isCorrectNetwork = chainId === 80002 || chainId === 31337 // Polygon Amoy testnet or localhost

  if (!isConnected) {
    return (
      <Card className="mb-6 bg-white border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <Wallet className="h-8 w-8 text-gray-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Connect Your Wallet</h3>
              <p className="text-sm text-gray-600 max-w-md">
                Connect your MetaMask wallet to receive relief funds directly to your account
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button 
              onClick={connectWallet} 
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-md"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4" />
                  <span>Connect MetaMask</span>
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500">
              Don't have MetaMask? 
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                Install it here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
                <Badge className="bg-green-500 text-white">Ready to Receive Funds</Badge>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="font-mono">{formatAddress(account!)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span>Balance: {balance} ETH</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <Badge 
                  variant={isCorrectNetwork ? "default" : "destructive"}
                  className={isCorrectNetwork ? "bg-blue-500" : ""}
                >
                  {chainId ? getNetworkName(chainId) : "Unknown Network"}
                </Badge>
                
                {!isCorrectNetwork && (
                  <span className="text-red-600">⚠️ Please switch to Polygon Amoy testnet</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://amoy.polygonscan.com/address/${account}`, '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Explorer
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {!isCorrectNetwork && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Network Warning</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  You're connected to the wrong network. Please switch to Polygon Amoy testnet to receive relief funds.
                </p>
              </div>
              <Button
                onClick={switchToAmoyNetwork}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Switch Network
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}