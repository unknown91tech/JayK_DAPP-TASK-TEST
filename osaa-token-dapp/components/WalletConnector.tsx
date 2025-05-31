// components/WalletConnector.tsx
'use client'

import { useState } from 'react'

interface WalletConnectorProps {
  account: string
  balance: string
  loading: boolean
  onConnect: () => Promise<void>
}

export default function WalletConnector({ 
  account, 
  balance, 
  loading, 
  onConnect 
}: WalletConnectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {!account ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-4">
            Connect MetaMask to interact with OSAA tokens
          </p>
          <button
            onClick={onConnect}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                🦊 Connect MetaMask
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Wallet Connected</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Address:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-mono text-sm break-all">
                  {account}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(account)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  📋 Copy Address
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">OSAA Token Balance:</p>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-md">
                <p className="text-2xl font-bold text-green-600">
                  {parseFloat(balance).toLocaleString()} 
                  <span className="text-sm text-gray-500 ml-1">OSAA</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}