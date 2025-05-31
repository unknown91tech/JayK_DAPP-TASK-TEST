// components/TokenTransfer.tsx
"use client";

import { useState } from 'react'

interface TokenTransferProps {
  loading: boolean
  userBalance: string
  onTransfer: (to: string, amount: string) => Promise<void>
}

export default function TokenTransfer({ loading, userBalance, onTransfer }: TokenTransferProps) {
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (transferTo && transferAmount) {
      await onTransfer(transferTo, transferAmount)
      // Clear form on successful transfer
      setTransferTo('')
      setTransferAmount('')
    }
  }

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.startsWith('0x') && text.length === 42) {
        setTransferTo(text)
      }
    } catch {
      console.log('Failed to read clipboard')
    }
  }

  const setMaxAmount = () => {
    setTransferAmount(userBalance)
  }

  const setPercentageAmount = (percentage: number) => {
    const amount = (parseFloat(userBalance) * percentage / 100).toString()
    setTransferAmount(amount)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
          <span className="text-white text-lg">📤</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Transfer Tokens</h3>
          <p className="text-sm text-gray-500">Send OSAA to others</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        Send your OSAA tokens to another Ethereum address. Make sure you have enough tokens and ETH for gas fees.
      </p>

      <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <span className="text-emerald-600 text-sm">💰</span>
          </div>
          <div>
            <p className="text-sm text-emerald-800 font-semibold">
              Available Balance: {parseFloat(userBalance).toLocaleString()} OSAA
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Recipient Address *
          </label>
          <div className="relative">
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x742d35Cc6841000fACEF9426dd9D7A4C09C9A22e"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 pr-20 text-sm font-mono"
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
            Enter the destination address for the token transfer
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Amount (OSAA) *
          </label>
          <div className="relative">
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="50"
              min="0.000000000000000001"
              max={userBalance}
              step="0.000000000000000001"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 pr-16 text-sm"
              required
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Amount to transfer (cannot exceed your balance)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPercentageAmount(25)}
            className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setPercentageAmount(50)}
            className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setPercentageAmount(75)}
            className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            75%
          </button>
          <button
            type="button"
            onClick={() => setPercentageAmount(100)}
            className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            100%
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !transferTo || !transferAmount || parseFloat(transferAmount) > parseFloat(userBalance)}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Transferring...
            </>
          ) : (
            <>
              <span className="mr-2">📤</span>
              Transfer Tokens
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">💡</span>
          </div>
          <div>
            <p className="text-sm text-blue-900 font-semibold">Gas Fee Required</p>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed">
              You&apos;ll need ETH in your wallet to pay for transaction gas fees. The token transfer itself is free, but Ethereum network fees apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}