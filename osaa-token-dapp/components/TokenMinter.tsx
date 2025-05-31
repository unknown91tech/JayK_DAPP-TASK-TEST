// components/TokenMinter.tsx
"use client";

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface TokenMinterProps {
  loading: boolean
  onMint: (to: string, amount: string) => Promise<void>
  contract: ethers.Contract | null
  account: string
}

export default function TokenMinter({ loading, onMint, contract, account }: TokenMinterProps) {
  const [mintTo, setMintTo] = useState<string>('')
  const [mintAmount, setMintAmount] = useState<string>('')
  const [isOwnerChecking, setIsOwnerChecking] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // Check if current account is authorized to mint
  const checkMintingAuthorization = async () => {
    if (!contract || !account) return

    try {
      setIsOwnerChecking(true)
      
      // Check if account has minting role (this depends on your contract implementation)
      // Common patterns: owner(), hasRole(), or direct mapping check
      
      // Method 1: Check if account is owner
      try {
        const owner = await contract.owner()
        if (owner.toLowerCase() === account.toLowerCase()) {
          setIsAuthorized(true)
          return
        }
      } catch {
        console.log('No owner() function found')
      }

      // Method 2: Check if account has MINTER_ROLE (for AccessControl contracts)
      try {
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
        const hasRole = await contract.hasRole(MINTER_ROLE, account)
        if (hasRole) {
          setIsAuthorized(true)
          return
        }
      } catch {
        console.log('No hasRole() function found')
      }

      // Method 3: Check minters mapping (if your contract has one)
      try {
        const isMinter = await contract.minters(account)
        if (isMinter) {
          setIsAuthorized(true)
          return
        }
      } catch {
        console.log('No minters() mapping found')
      }

      // If none of the above worked, assume not authorized
      setIsAuthorized(false)
      
    } catch (err) {
      console.error('Error checking minting authorization:', err)
      setIsAuthorized(false)
    } finally {
      setIsOwnerChecking(false)
    }
  }

  // Check authorization when component mounts or contract/account changes
  useEffect(() => {
    if (contract && account) {
      checkMintingAuthorization()
    }
  }, [contract, account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mintTo && mintAmount) {
      await onMint(mintTo, mintAmount)
      // Clear form on successful mint
      setMintTo('')
      setMintAmount('')
    }
  }

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.startsWith('0x') && text.length === 42) {
        setMintTo(text)
      }
    } catch {
      console.log('Failed to read clipboard')
    }
  }

  const fillOwnAddress = () => {
    if (account) {
      setMintTo(account)
    }
  }

  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount)
    return !isNaN(num) && num > 0 && num <= 1000000 // Max 1M tokens per mint
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
          <span className="text-white text-lg">🏭</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Mint Tokens</h3>
          <p className="text-sm text-gray-500">Create new OSAA tokens</p>
        </div>
      </div>

      {/* Authorization Status */}
      <div className="mb-6">
        {isOwnerChecking ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-blue-800 font-medium">Checking minting permissions...</p>
            </div>
          </div>
        ) : isAuthorized === true ? (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 text-sm">✅</span>
              </div>
              <div>
                <p className="text-sm text-emerald-800 font-semibold">Minting Authorized</p>
                <p className="text-xs text-emerald-700">You have permission to mint OSAA tokens</p>
              </div>
            </div>
          </div>
        ) : isAuthorized === false ? (
          <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm">❌</span>
              </div>
              <div>
                <p className="text-sm text-red-800 font-semibold">Minting Not Authorized</p>
                <p className="text-xs text-red-700">You don&apos;t have permission to mint tokens</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        Create new OSAA tokens and send them to any address. Only authorized minters can perform this action successfully.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Recipient Address *
          </label>
          <div className="relative">
            <input
              type="text"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              placeholder="0x742d35Cc6841000fACEF9426dd9D7A4C09C9A22e"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pr-20 text-sm font-mono"
              required
            />
            <button
              type="button"
              onClick={handlePasteAddress}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              📋 Paste
            </button>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-xs text-gray-500">
              Enter the Ethereum address that will receive the tokens
            </p>
            {account && (
              <button
                type="button"
                onClick={fillOwnAddress}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Use my address
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Amount (OSAA) *
          </label>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="100"
            min="0.000000000000000001"
            max="1000000"
            step="0.000000000000000001"
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Number of tokens to mint (max 1,000,000 per transaction)
          </p>
          {mintAmount && !validateAmount(mintAmount) && (
            <p className="text-xs text-red-600 mt-1">
              Please enter a valid amount between 0 and 1,000,000
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMintAmount('100')}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            100
          </button>
          <button
            type="button"
            onClick={() => setMintAmount('1000')}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            1,000
          </button>
          <button
            type="button"
            onClick={() => setMintAmount('10000')}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            10,000
          </button>
          <button
            type="button"
            onClick={() => setMintAmount('100000')}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            100,000
          </button>
        </div>

        <button
          type="submit"
          disabled={
            loading || 
            !mintTo || 
            !mintAmount || 
            !validateAmount(mintAmount) ||
            isAuthorized === false
          }
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Minting Tokens...
            </>
          ) : (
            <>
              <span className="mr-2">🏭</span>
              Mint Tokens
            </>
          )}
        </button>
      </form>

      {/* Information Boxes */}
      <div className="mt-6 space-y-4">
        {/* Authorization Warning */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-amber-900 font-semibold">Authorization Required</p>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                Only authorized addresses can mint tokens. If you&apos;re not authorized, the transaction will fail and you&apos;ll still pay gas fees.
              </p>
            </div>
          </div>
        </div>

        {/* Gas Fee Info */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">💡</span>
            </div>
            <div>
              <p className="text-sm text-blue-900 font-semibold">Gas Fees Apply</p>
              <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                Minting requires ETH for gas fees. The cost varies based on network congestion. Always ensure you have enough ETH in your wallet.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Authorization Button */}
        <button
          onClick={checkMintingAuthorization}
          disabled={isOwnerChecking || !contract || !account}
          className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
        >
          {isOwnerChecking ? 'Checking...' : '🔄 Refresh Authorization Status'}
        </button>
      </div>
    </div>
  )
}