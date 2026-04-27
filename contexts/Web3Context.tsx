"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Web3ContextType {
  account: string | null
  isConnected: boolean
  balance: string
  chainId: number | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToAmoyNetwork: () => Promise<void>
  loading: boolean
  error: string | null
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [chainId, setChainId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = !!account

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // Get account balance
  const getBalance = async (address: string) => {
    if (!window.ethereum) return '0'
    
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
      
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18)
      return balanceInEth.toFixed(4)
    } catch (error) {
      console.error('Error getting balance:', error)
      return '0'
    }
  }

  // Switch to Polygon Amoy testnet
  const switchToAmoyNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // 80002 in hex (Polygon Amoy)
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              },
            ],
          })
        } catch (addError) {
          throw new Error('Failed to add Polygon Amoy network to MetaMask')
        }
      } else {
        throw switchError
      }
    }
  }

  // Switch to Hardhat localhost network
  const switchToLocalhostNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69',
                chainName: 'Hardhat Localhost',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Hardhat Localhost network to MetaMask.');
        }
      } else {
        throw switchError;
      }
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length > 0) {
        const account = accounts[0]
        
        // Get current chain ID
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        })
        const currentChainId = parseInt(chainId, 16)
        
        // If not on localhost, switch to it for local development.
        if (currentChainId !== 31337) {
          await switchToLocalhostNetwork();
          // Get the chain ID again after switching
          const newChainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          setChainId(parseInt(newChainId, 16));
        } else {
          setChainId(currentChainId);
        }
        
        setAccount(account)
        
        // Get balance
        const balance = await getBalance(account)
        setBalance(balance)

        // Don't store in localStorage to prevent auto-connection
      }
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error)
      setError(error.message || 'Failed to connect to MetaMask')
    } finally {
      setLoading(false)
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null)
    setBalance('0')
    setChainId(null)
    setError(null)
    // Clear any stored connection data
    localStorage.removeItem('web3_account')
  }

  // Don't auto-connect - require manual connection each time
  // This ensures users connect to the correct network

  // Only listen for events when connected to prevent auto-reconnection
  useEffect(() => {
    if (!isMetaMaskInstalled() || !isConnected) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (isConnected) {
        // Only update if we're already connected
        setAccount(accounts[0])
        getBalance(accounts[0]).then(setBalance)
      }
    }

    const handleChainChanged = (chainId: string) => {
      if (isConnected) {
        // Only update if we're already connected
        setChainId(parseInt(chainId, 16))
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [isConnected])

  const value: Web3ContextType = {
    account,
    isConnected,
    balance,
    chainId,
    connectWallet,
    disconnectWallet,
    switchToAmoyNetwork,
    loading,
    error
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}