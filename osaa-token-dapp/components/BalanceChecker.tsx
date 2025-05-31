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
    } catch {
      console.log('Failed to read clipboard')
    }
  }

  const clearResults = () => {
    setCheckAddress('')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mr-4">
          <span className="text-white text-lg">🔍</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Balance Checker</h3>
          <p className="text-sm text-gray-500">Lookup token balance</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        Look up the OSAA token balance for any Ethereum address. This is a read-only operation that doesn&apos;t require gas fees.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Ethereum Address *
          </label>
          <div className="relative">
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x742d35Cc6841000fACEF9426dd9D7A4C09C9A22e"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 pr-20 text-sm font-mono"
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
          <p className="text-xs text-gray-500 mt-2">
            Enter any valid Ethereum address (42 characters starting with 0x)
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !checkAddress}
            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100"
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
              <>
                <span className="mr-2">🔍</span>
                Check Balance
              </>
            )}
          </button>
          
          {checkedBalance && (
            <button
              type="button"
              onClick={clearResults}
              className="px-4 py-4 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl"
              title="Clear results"
            >
              🗑️
            </button>
          )}
        </div>
      </form>

      {/* Results Display */}
      {checkedBalance && checkedAddress && (
        <div className="mt-8 space-y-4">
          <div className="border-t-2 border-gray-100 pt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Balance Result</h4>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-purple-700 font-bold uppercase tracking-wider mb-2">Ethereum Address</p>
                  <p className="font-mono text-sm text-gray-800 break-all bg-white p-3 rounded-lg border border-purple-200">
                    {checkedAddress}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-purple-700 font-bold uppercase tracking-wider mb-2">Token Balance</p>
                  <div className="flex items-baseline space-x-3">
                    <p className="text-3xl font-bold text-purple-800">
                      {parseFloat(checkedBalance).toLocaleString()}
                    </p>
                    <p className="text-lg text-purple-600 font-semibold">OSAA</p>
                  </div>
                </div>

                {parseFloat(checkedBalance) === 0 && (
                  <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    <span className="text-amber-600">⚠️</span>
                    <p className="text-sm text-amber-800 font-medium">This address has no OSAA tokens</p>
                  </div>
                )}

                {parseFloat(checkedBalance) > 0 && (
                  <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                    <span className="text-emerald-600">✅</span>
                    <p className="text-sm text-emerald-800 font-medium">Balance found successfully</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex items-start space-x-3">
          <span className="text-blue-500 text-lg">💡</span>
          <div>
            <p className="text-sm text-gray-800 font-semibold">How it works</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              This function reads data directly from the blockchain. No transaction fees required, and the result is always up-to-date with the latest block.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}