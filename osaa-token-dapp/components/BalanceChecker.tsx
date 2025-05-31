// components/BalanceChecker.tsx
'use client'

import { useState } from 'react'

interface BalanceCheckerProps {
  loading: boolean
  onCheckBalance: (address: string) => Promise<void>
  checkedBalance: string
  checkedAddress: string
}

export default function BalanceChecker({ 
  loading, 
  onCheckBalance, 
  checkedBalance, 
  checkedAddress 
}: BalanceCheckerProps) {
  const [checkAddress, setCheckAddress] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (checkAddress) {
      await onCheckBalance(checkAddress)
    }
  }

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.startsWith('0x') && text.length === 42) {
        setCheckAddress(text)
      }
    } catch (err) {
      console.log('Failed to read clipboard')
    }
  }

  const clearResults = () => {
    setCheckAddress('')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-purple-600 text-lg">🔍</span>
        </div>
        <h3 className="text-lg font-semibold text-purple-600">Check Balance</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Look up the OSAA token balance for any Ethereum address. This is a read-only operation that doesn't require gas.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address to Check *
          </label>
          <div className="relative">
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x742d35Cc6841000fACEF9426dd9D7A4C09C9A22e"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-20"
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
            Enter any valid Ethereum address to check its OSAA token balance
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading || !checkAddress}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </>
            ) : (
              '🔍 Check Balance'
            )}
          </button>
          
          {checkedBalance && (
            <button
              type="button"
              onClick={clearResults}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              title="Clear results"
            >
              🗑️
            </button>
          )}
        </div>
      </form>

      {/* Results Display */}
      {checkedBalance && checkedAddress && (
        <div className="mt-6 space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Balance Result</h4>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Address</p>
                  <p className="font-mono text-sm text-gray-800 break-all mt-1">
                    {checkedAddress}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">OSAA Balance</p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-2xl font-bold text-purple-700">
                      {parseFloat(checkedBalance).toLocaleString()}
                    </p>
                    <p className="text-sm text-purple-600">OSAA</p>
                  </div>
                </div>

                {parseFloat(checkedBalance) === 0 && (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <span>⚠️</span>
                    <p className="text-xs">This address has no OSAA tokens</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-start">
          <span className="text-gray-500 mr-2">ℹ️</span>
          <div>
            <p className="text-xs text-gray-700 font-medium">How it works</p>
            <p className="text-xs text-gray-600 mt-1">
              This function reads data directly from the blockchain. No transaction fees required, and the result is always up-to-date.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}