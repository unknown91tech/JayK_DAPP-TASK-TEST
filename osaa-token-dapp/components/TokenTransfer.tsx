// components/TokenTransfer.tsx
'use client'

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
    } catch (err) {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-green-600 text-lg">📤</span>
        </div>
        <h3 className="text-lg font-semibold text-green-600">Transfer Tokens</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Send your OSAA tokens to another Ethereum address. Make sure you have enough tokens and ETH for gas.
      </p>

      <div className="mb-4 p-3 bg-green-50 rounded-md">
        <p className="text-sm text-green-800">
          Available Balance: <span className="font-semibold">{parseFloat(userBalance).toLocaleString()} OSAA</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address *
          </label>
          <div className="relative">
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x742d35Cc6841000fACEF9426dd9D7A4C09C9A22e"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-20"
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
            Enter the destination address for the token transfer
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16"
              required
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Amount to transfer (cannot exceed your balance)
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setPercentageAmount(25)}
            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setPercentageAmount(50)}
            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setPercentageAmount(75)}
            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
          >
            75%
          </button>
          <button
            type="button"
            onClick={() => setPercentageAmount(100)}
            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
          >
            100%
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !transferTo || !transferAmount || parseFloat(transferAmount) > parseFloat(userBalance)}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Transferring Tokens...
            </>
          ) : (
            '📤 Transfer Tokens'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-start">
          <span className="text-blue-500 mr-2">💡</span>
          <div>
            <p className="text-xs text-blue-800 font-medium">Gas Fee Required</p>
            <p className="text-xs text-blue-700 mt-1">
              You'll need ETH in your wallet to pay for transaction gas fees. The token transfer itself is free.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}