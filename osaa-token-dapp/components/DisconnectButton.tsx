// components/DisconnectButton.tsx
"use client";

import { useState } from 'react'

interface DisconnectButtonProps {
  onDisconnect: () => void
  account: string
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
}

export default function DisconnectButton({ 
  onDisconnect, 
  account, 
  variant = 'default',
  className = '' 
}: DisconnectButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleDisconnect = () => {
    if (isConfirming) {
      onDisconnect()
      setIsConfirming(false)
    } else {
      setIsConfirming(true)
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setIsConfirming(false)
      }, 3000)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsConfirming(false)
  }

  // Don't render if no account is connected
  if (!account) return null

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        {!isConfirming ? (
          <button
            onClick={handleDisconnect}
            className="w-10 h-10 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl flex items-center justify-center transition-all duration-200 group"
            title="Disconnect wallet"
          >
            <span className="text-red-600 group-hover:text-red-700 text-lg">🔌</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDisconnect}
              className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center transition-all duration-200"
              title="Confirm disconnect"
            >
              <span className="text-white text-sm">✓</span>
            </button>
            <button
              onClick={handleCancel}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl flex items-center justify-center transition-all duration-200"
              title="Cancel"
            >
              <span className="text-gray-600 text-sm">✕</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        {!isConfirming ? (
          <button
            onClick={handleDisconnect}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg text-red-600 hover:text-red-700 font-medium text-sm transition-all duration-200 flex items-center space-x-2"
          >
            <span>🔌</span>
            <span>Disconnect</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-1"
            >
              <span>✓</span>
              <span>Confirm</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 rounded-lg text-sm transition-all duration-200"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={`relative ${className}`}>
      {!isConfirming ? (
        <button
          onClick={handleDisconnect}
          className="px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-2 border-red-200 hover:border-red-300 rounded-xl text-red-700 hover:text-red-800 font-semibold transition-all duration-200 flex items-center space-x-3 transform hover:scale-105 shadow-sm"
        >
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-600 text-lg">🔌</span>
          </div>
          <div className="text-left">
            <p className="text-sm">Disconnect Wallet</p>
            <p className="text-xs text-red-600">
              {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        </button>
      ) : (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Confirm Disconnect</p>
                <p className="text-xs text-red-600">This will disconnect your wallet</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDisconnect}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>✓</span>
              <span>Yes, Disconnect</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}