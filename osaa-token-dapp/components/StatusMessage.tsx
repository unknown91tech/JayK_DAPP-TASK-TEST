// components/StatusMessage.tsx
'use client'

import { useEffect } from 'react'

interface StatusMessageProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export default function StatusMessage({ 
  type, 
  message, 
  onClose, 
  autoClose = false, 
  duration = 5000 
}: StatusMessageProps) {
  // Auto-close functionality with cleanup
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200',
          icon: '🚨',
          iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
          textColor: 'text-red-900',
          buttonColor: 'text-red-600 hover:text-red-800 hover:bg-red-100'
        }
      case 'success':
        return {
          container: 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200',
          icon: '🎉',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
          textColor: 'text-emerald-900',
          buttonColor: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100'
        }
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200',
          icon: '⚠️',
          iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
          textColor: 'text-amber-900',
          buttonColor: 'text-amber-600 hover:text-amber-800 hover:bg-amber-100'
        }
      case 'info':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200',
          icon: 'ℹ️',
          iconBg: 'bg-gradient-to-br from-blue-500 to-sky-600',
          textColor: 'text-blue-900',
          buttonColor: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
        }
      default:
        return {
          container: 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200',
          icon: 'ℹ️',
          iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
          textColor: 'text-gray-900',
          buttonColor: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }
    }
  }

  const styles = getStyles()

  return (
    <div className={`${styles.container} rounded-xl p-6 mb-6 shadow-lg animate-slide-in-from-top`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <span className="text-black text-lg">
              {styles.icon}
            </span>
          </div>
          <div className="flex-1">
            <p className={`${styles.textColor} font-medium leading-relaxed`}>
              {message}
            </p>
            
            {/* Additional help text for specific error types */}
            {type === 'error' && message.includes('MetaMask') && (
              <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">Troubleshooting Steps:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Make sure MetaMask is installed and unlocked</li>
                  <li>• Check that you're connected to the correct network</li>
                  <li>• Try refreshing the page and reconnecting</li>
                </ul>
              </div>
            )}
            
            {type === 'error' && message.includes('insufficient') && (
              <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">Balance Check:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Check your token balance before transferring</li>
                  <li>• Make sure you have enough ETH for gas fees</li>
                </ul>
              </div>
            )}
            
            {type === 'error' && message.includes('unauthorized') && (
              <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">Authorization Required:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Only authorized addresses can mint tokens</li>
                  <li>• Contact the contract owner to get minting permissions</li>
                </ul>
              </div>
            )}

            {type === 'success' && message.includes('successful') && (
              <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-lg">
                <p className="text-sm font-semibold text-emerald-800 mb-2">Transaction Complete:</p>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Transaction has been confirmed on the blockchain</li>
                  <li>• Balances will update automatically</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className={`${styles.buttonColor} transition-all duration-200 flex-shrink-0 ml-4 p-2 rounded-lg`}
          aria-label="Close message"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}