// app/page.tsx - Updated main page using components
'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// Import components
import WalletConnector from '../components/WalletConnector'
import TokenMinter from '../components/TokenMinter'
import TokenTransfer from '../components/TokenTransfer'
import BalanceChecker from '../components/BalanceChecker'
import StatusMessage from '../components/StatusMessage'
import MetaMaskNotice from '../components/MetaMaskNotice'

// Contract ABI - simplified for the 3 main functions
const OSAA_ABI = [
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)"
]

// Get contract address from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x206e8D8856b20b198271b1C1A413D1Ff56Bbf1D1"

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

  // Check if MetaMask is available
  const isMetaMaskAvailable = (): boolean => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
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
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Create provider and get signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // Create contract instance
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, OSAA_ABI, signer)

      // Update state
      setAccount(userAddress)
      setContract(contractInstance)
      setSuccess('Wallet connected successfully!')

      // Load user balance
      await loadBalance(contractInstance, userAddress)

    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
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

  // Mint tokens function
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
        setError('Invalid recipient address')
        return
      }

      // Convert amount to wei
      const amount = ethers.parseUnits(mintAmount, 18)

      // Send mint transaction
      const tx = await contract.mint(mintTo, amount)
      setSuccess('Transaction submitted! Waiting for confirmation...')

      // Wait for confirmation
      await tx.wait()
      setSuccess(`Successfully minted ${mintAmount} OSAA tokens to ${mintTo.slice(0, 6)}...${mintTo.slice(-4)}!`)

      // Refresh balance
      await loadBalance(contract, account)

    } catch (err: any) {
      if (err.message.includes('user rejected')) {
        setError('Transaction cancelled by user')
      } else if (err.message.includes('Not authorized')) {
        setError('You are not authorized to mint tokens')
      } else {
        setError(`Minting failed: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Transfer tokens function
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
        setError('Invalid recipient address')
        return
      }

      // Convert amount to wei
      const amount = ethers.parseUnits(transferAmount, 18)

      // Send transfer transaction
      const tx = await contract.transfer(transferTo, amount)
      setSuccess('Transaction submitted! Waiting for confirmation...')

      // Wait for confirmation
      await tx.wait()
      setSuccess(`Successfully transferred ${transferAmount} OSAA tokens to ${transferTo.slice(0, 6)}...${transferTo.slice(-4)}!`)

      // Refresh balance
      await loadBalance(contract, account)

    } catch (err: any) {
      if (err.message.includes('user rejected')) {
        setError('Transaction cancelled by user')
      } else if (err.message.includes('insufficient funds')) {
        setError('Insufficient balance for transfer')
      } else {
        setError(`Transfer failed: ${err.message}`)
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
      setCheckedBalance(ethers.formatUnits(balance, 18))
      setCheckedAddress(checkAddress)

    } catch (err: any) {
      setError(`Failed to check balance: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskAvailable()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount('')
          setContract(null)
          setBalance('0')
        } else {
          setAccount(accounts[0])
          if (contract) {
            loadBalance(contract, accounts[0])
          }
        }
      }

      const handleChainChanged = () => {
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [contract])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            OSAA Token dApp
          </h1>
          <p className="text-lg text-gray-600">
            OneStep Authentication Asset - Token Management Interface
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Built with Next.js 15 & Ethereum • Part C Assignment
          </p>
        </div>

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
            duration={6000}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <TokenMinter
              loading={loading}
              onMint={handleMint}
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

        {/* Contract Information */}
        {account && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Contract Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Contract Address:</p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {CONTRACT_ADDRESS}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Network:</p>
                <p className="font-semibold text-blue-600 capitalize">
                  {process.env.NEXT_PUBLIC_NETWORK || 'Sepolia Testnet'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-xs hover:bg-blue-200 transition-colors"
              >
                🔍 View on Etherscan
              </a>
              <a
                href={`https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs hover:bg-green-200 transition-colors"
              >
                📊 Token Info
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-2">
            OSAA Token dApp - Demonstrating blockchain development skills
          </p>
          <p className="text-gray-400 text-xs">
            Part C of OneStep Authentication Assignment • Next.js 15 + Ethereum
          </p>
        </div>
      </div>
    </div>
  )
}