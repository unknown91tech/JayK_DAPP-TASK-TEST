/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx - Production ready with proper TypeScript types
"use client";

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// Extend Window interface to include ethereum
interface MetaMaskEthereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
  isMetaMask?: boolean
}

declare global {
  interface Window {
    ethereum?: MetaMaskEthereum
  }
}

// Import components
import WalletConnector from '../components/WalletConnector'
import TokenMinter from '../components/TokenMinter'
import TokenTransfer from '../components/TokenTransfer'
import BalanceChecker from '../components/BalanceChecker'
import StatusMessage from '../components/StatusMessage'
import MetaMaskNotice from '../components/MetaMaskNotice'
import DisconnectButton from '../components/DisconnectButton'

// Contract ABI - Enhanced with more functions for better minting support
const OSAA_ABI = [
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  // Authorization checking functions (not all contracts will have these)
  "function owner() external view returns (address)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function minters(address account) external view returns (bool)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mint(address indexed to, uint256 amount)"
]

// Get contract address from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x206e8D8856b20b198271b1C1A413D1Ff56Bbf1D1"

interface NetworkInfo {
  name: string
  chainId: number
}

interface ErrorWithCode extends Error {
  code?: number
  reason?: string
}

export default function OSAATokenDApp() {
  // Core state
  const [account, setAccount] = useState<string>('')
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Balance checker state
  const [checkedBalance, setCheckedBalance] = useState<string>('')
  const [checkedAddress, setCheckedAddress] = useState<string>('')

  // Network info state
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount('')
    setContract(null)
    setBalance('0')
    setNetworkInfo(null)
    setCheckedBalance('')
    setCheckedAddress('')
    setError('')
    setSuccess('Wallet disconnected successfully!')
  }

  // Check if MetaMask is available
  const isMetaMaskAvailable = (): boolean => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // Get network information
  const getNetworkInfo = async (provider: ethers.BrowserProvider) => {
    try {
      const network = await provider.getNetwork()
      setNetworkInfo({
        name: network.name,
        chainId: Number(network.chainId)
      })
    } catch (err) {
      console.error('Failed to get network info:', err)
    }
  }

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if (!isMetaMaskAvailable()) {
      setError('MetaMask is required. Please install MetaMask extension.')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Request account access
      await window.ethereum?.request({ method: 'eth_requestAccounts' })

      // Create provider and get signer
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // Get network info
      await getNetworkInfo(provider)

      // Create contract instance
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, OSAA_ABI, signer)

      // Update state
      setAccount(userAddress)
      setContract(contractInstance)
      setSuccess('Wallet connected successfully!')

      // Load user balance
      await loadBalance(contractInstance, userAddress)

    } catch (err) {
      const error = err as ErrorWithCode
      if (error.code === 4001) {
        setError('Connection rejected by user')
      } else if (error.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(`Failed to connect wallet: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load user balance
  const loadBalance = async (contractInstance: ethers.Contract, address: string) => {
    try {
      const balance = await contractInstance.balanceOf(address)
      setBalance(ethers.formatUnits(balance, 18))
    } catch (err) {
      console.error('Failed to load balance:', err)
    }
  }

  // Enhanced mint function with better error handling
  const handleMint = async (mintTo: string, mintAmount: string) => {
    if (!contract) {
      setError('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Validate inputs
      if (!ethers.isAddress(mintTo)) {
        setError('Invalid recipient address format')
        return
      }

      const amount = parseFloat(mintAmount)
      if (isNaN(amount) || amount <= 0) {
        setError('Invalid amount. Please enter a positive number.')
        return
      }

      if (amount > 1000000) {
        setError('Amount too large. Maximum 1,000,000 tokens per transaction.')
        return
      }

      // Convert amount to wei (18 decimals)
      const amountInWei = ethers.parseUnits(mintAmount, 18)

      // Estimate gas before sending transaction
      try {
        const gasEstimate = await contract.mint.estimateGas(mintTo, amountInWei)
        console.log('Estimated gas:', gasEstimate.toString())
      } catch (gasErr) {
        const error = gasErr as ErrorWithCode
        if (error.message?.includes('unauthorized') || error.message?.includes('not authorized')) {
          setError('You are not authorized to mint tokens. Only the contract owner or authorized minters can mint.')
          return
        }
        console.warn('Gas estimation failed:', error.message)
      }

      // Send mint transaction
      const tx = await contract.mint(mintTo, amountInWei)
      setSuccess(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}... Waiting for confirmation...`)

      // Wait for confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        setSuccess(`✅ Successfully minted ${mintAmount} OSAA tokens to ${mintTo.slice(0, 6)}...${mintTo.slice(-4)}!`)
        
        // Refresh balance if minting to current user
        if (mintTo.toLowerCase() === account.toLowerCase()) {
          await loadBalance(contract, account)
        }
      } else {
        setError('Transaction failed. Please check the transaction details.')
      }

    } catch (err) {
      const error = err as ErrorWithCode
      if (error.code === 4001) {
        setError('Transaction cancelled by user')
      } else if (error.message?.includes('unauthorized') || error.message?.includes('not authorized')) {
        setError('You are not authorized to mint tokens')
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient ETH for gas fees')
      } else if (error.message?.includes('gas')) {
        setError('Transaction failed due to gas issues. Try increasing gas limit.')
      } else {
        setError(`Minting failed: ${error.reason || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Enhanced transfer function with better error handling
  const handleTransfer = async (transferTo: string, transferAmount: string) => {
    if (!contract) {
      setError('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Validate inputs
      if (!ethers.isAddress(transferTo)) {
        setError('Invalid recipient address format')
        return
      }

      const amount = parseFloat(transferAmount)
      if (isNaN(amount) || amount <= 0) {
        setError('Invalid amount. Please enter a positive number.')
        return
      }

      const userBalanceFloat = parseFloat(balance)
      if (amount > userBalanceFloat) {
        setError(`Insufficient balance. You have ${userBalanceFloat.toLocaleString()} OSAA tokens.`)
        return
      }

      // Convert amount to wei
      const amountInWei = ethers.parseUnits(transferAmount, 18)

      // Send transfer transaction
      const tx = await contract.transfer(transferTo, amountInWei)
      setSuccess(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}... Waiting for confirmation...`)

      // Wait for confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        setSuccess(`✅ Successfully transferred ${transferAmount} OSAA tokens to ${transferTo.slice(0, 6)}...${transferTo.slice(-4)}!`)
        
        // Refresh balance
        await loadBalance(contract, account)
      } else {
        setError('Transaction failed. Please check the transaction details.')
      }

    } catch (err) {
      const error = err as ErrorWithCode
      if (error.code === 4001) {
        setError('Transaction cancelled by user')
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('transfer amount exceeds balance')) {
        setError('Insufficient token balance for transfer')
      } else if (error.message?.includes('gas')) {
        setError('Transaction failed due to gas issues. Try increasing gas limit.')
      } else {
        setError(`Transfer failed: ${error.reason || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Check balance of any address
  const handleCheckBalance = async (checkAddress: string) => {
    if (!contract) {
      setError('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      setError('')

      if (!ethers.isAddress(checkAddress)) {
        setError('Invalid address format')
        return
      }

      const balance = await contract.balanceOf(checkAddress)
      const formattedBalance = ethers.formatUnits(balance, 18)
      
      setCheckedBalance(formattedBalance)
      setCheckedAddress(checkAddress)

    } catch (err) {
      const error = err as ErrorWithCode
      setError(`Failed to check balance: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Listen for account and network changes
  useEffect(() => {
    if (isMetaMaskAvailable()) {
      const handleAccountsChanged = (accounts: any) => {
        if (accounts.length === 0) {
          setAccount('')
          setContract(null)
          setBalance('0')
          setNetworkInfo(null)
        } else if (accounts[0] !== account) {
          setAccount(accounts[0])
          if (contract) {
            loadBalance(contract, accounts[0])
          }
        }
      }

      const handleChainChanged = (chainId: any) => {
        console.log('Chain changed to:', chainId)
        // Reload the page to reset all state
        window.location.reload()
      }

      window.ethereum?.on('accountsChanged', handleAccountsChanged)
      window.ethereum?.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [contract, account])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-3xl">🪙</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            OSAA Token dApp
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            OneStep Authentication Asset - Token Management Interface
          </p>
          <div className="flex items-center justify-center space-x-4">
            {networkInfo && (
              <p className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                Connected to {networkInfo.name} (Chain ID: {networkInfo.chainId})
              </p>
            )}
          </div>
        </div>

        {/* Separate Disconnect Button - Only show when connected */}
        {account && (
          <div className="flex justify-center mb-8">
            <DisconnectButton 
              account={account}
              onDisconnect={disconnectWallet}
              variant="default"
            />
          </div>
        )}

        {/* MetaMask Notice */}
        <MetaMaskNotice isMetaMaskAvailable={isMetaMaskAvailable()} />

        {/* Status Messages */}
        {error && (
          <StatusMessage 
            type="error" 
            message={error} 
            onClose={() => setError('')} 
          />
        )}

        {success && (
          <StatusMessage 
            type="success" 
            message={success} 
            onClose={() => setSuccess('')}
            autoClose={true}
            duration={8000}
          />
        )}

        {/* Wallet Connection */}
        <WalletConnector
          account={account}
          balance={balance}
          loading={loading}
          onConnect={connectWallet}
        />

        {/* Main Functions - Only show when wallet is connected */}
        {account && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
            <TokenMinter
              loading={loading}
              onMint={handleMint}
              contract={contract}
              account={account}
            />

            <TokenTransfer
              loading={loading}
              userBalance={balance}
              onTransfer={handleTransfer}
            />

            <BalanceChecker
              loading={loading}
              onCheckBalance={handleCheckBalance}
              checkedBalance={checkedBalance}
              checkedAddress={checkedAddress}
            />
          </div>
        )}

        {/* Additional Disconnect Options */}
        {account && (
          <div className="flex justify-center space-x-4 mb-8">
            <DisconnectButton 
              account={account}
              onDisconnect={disconnectWallet}
              variant="compact"
            />
            <DisconnectButton 
              account={account}
              onDisconnect={disconnectWallet}
              variant="icon-only"
            />
          </div>
        )}

        {/* Contract Information */}
        {account && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Contract Information</h3>
              </div>
              {/* Compact disconnect button in top-right corner */}
              <DisconnectButton 
                account={account}
                onDisconnect={disconnectWallet}
                variant="compact"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Contract Address:</p>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <p className="font-mono text-sm text-gray-800 break-all">
                    {CONTRACT_ADDRESS}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors mt-2"
                  >
                    📋 Copy Contract Address
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Network Information:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <p className="font-semibold text-blue-700">
                      {networkInfo?.name || 'Hoodi Testnet'}
                    </p>
                  </div>
                  <p className="text-sm text-blue-600">
                    Chain ID: {networkInfo?.chainId || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://hoodi.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <span className="mr-2">🔍</span>
                View on Etherscan
              </a>
              <a
                href={`https://hoodi.etherscan.io/token/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <span className="mr-2">📊</span>
                Token Details
              </a>
              {account && (
                <a
                  href={`https://hoodi.etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <span className="mr-2">👤</span>
                  My Address
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}