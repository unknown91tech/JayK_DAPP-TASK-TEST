// components/TokenMinter.tsx
'use client'

import { useState } from 'react'

interface TokenMinterProps {
  loading: boolean
  onMint: (to: string, amount: string) => Promise<void>
}

export default function TokenMinter({ loading, onMint }: TokenMinterProps) {
  const [mintTo, setMintTo] = useState<string>('')
  const [mintAmount, setMintAmount] = useState<string>('')

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
    } catch (err) {
      console.log('Failed to read clipboard')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-blue-600 text-lg">🏭</span>
        </div>
        <h3 className="text-lg font-semibold text-blue-600">Mint Tokens</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Create new OSAA tokens and send them to any address. Only authorized minters can perform this action.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address *
          </label>
          <div className="relative">
            <input
              type="text"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              placeholder="0x742d35Cc6841000fACEF9426dd9D7A4C09C9A22e"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
              required
            />
            <button
              type="button"
              onClick={handlePasteAddress}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              📋 Paste
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the Ethereum address that will receive the tokens
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (OSAA) *
          </label>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="100"
            min="0.000000000000000001"
            step="0.000000000000000001"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of tokens to mint (supports up to 18 decimal places)
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setMintAmount('100')}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            100
          </button>
          <button
            type="button"
            onClick={() => setMintAmount('1000')}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            1,000
          </button>
          <button
            type="button"
            onClick={() => setMintAmount('10000')}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            10,000
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !mintTo || !mintAmount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
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
            '🏭 Mint Tokens'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <div className="flex items-start">
          <span className="text-yellow-500 mr-2">⚠️</span>
          <div>
            <p className="text-xs text-yellow-800 font-medium">Authorization Required</p>
            <p className="text-xs text-yellow-700 mt-1">
              Only authorized addresses can mint tokens. If you're not authorized, this transaction will fail.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}