// components/StatusMessage.tsx
'use client'

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
  // Auto-close functionality
  if (autoClose) {
    setTimeout(() => {
      onClose()
    }, duration)
  }

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border border-red-200',
          icon: '⚠️',
          iconColor: 'text-red-400',
          textColor: 'text-red-800',
          buttonColor: 'text-red-600 hover:text-red-800'
        }
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200',
          icon: '✅',
          iconColor: 'text-green-400',
          textColor: 'text-green-800',
          buttonColor: 'text-green-600 hover:text-green-800'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border border-yellow-200',
          icon: '⚠️',
          iconColor: 'text-yellow-400',
          textColor: 'text-yellow-800',
          buttonColor: 'text-yellow-600 hover:text-yellow-800'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border border-blue-200',
          icon: 'ℹ️',
          iconColor: 'text-blue-400',
          textColor: 'text-blue-800',
          buttonColor: 'text-blue-600 hover:text-blue-800'
        }
      default:
        return {
          container: 'bg-gray-50 border border-gray-200',
          icon: 'ℹ️',
          iconColor: 'text-gray-400',
          textColor: 'text-gray-800',
          buttonColor: 'text-gray-600 hover:text-gray-800'
        }
    }
  }

  const styles = getStyles()

  return (
    <div className={`${styles.container} rounded-md p-4 mb-6 animate-slide-in-from-top`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className={`${styles.iconColor} text-lg flex-shrink-0`}>
            {styles.icon}
          </span>
          <div className="flex-1">
            <p className={`${styles.textColor} text-sm leading-relaxed`}>
              {message}
            </p>
            
            {/* Additional help text for specific error types */}
            {type === 'error' && message.includes('MetaMask') && (
              <div className="mt-2 text-xs text-red-700">
                <p>• Make sure MetaMask is installed and unlocked</p>
                <p>• Check that you're connected to the correct network</p>
                <p>• Try refreshing the page and reconnecting</p>
              </div>
            )}
            
            {type === 'error' && message.includes('insufficient') && (
              <div className="mt-2 text-xs text-red-700">
                <p>• Check your token balance before transferring</p>
                <p>• Make sure you have enough ETH for gas fees</p>
              </div>
            )}
            
            {type === 'error' && message.includes('unauthorized') && (
              <div className="mt-2 text-xs text-red-700">
                <p>• Only authorized addresses can mint tokens</p>
                <p>• Contact the contract owner to get minting permissions</p>
              </div>
            )}

            {type === 'success' && message.includes('successful') && (
              <div className="mt-2 text-xs text-green-700">
                <p>• Transaction has been confirmed on the blockchain</p>
                <p>• Balances will update automatically</p>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className={`${styles.buttonColor} transition-colors flex-shrink-0 ml-4`}
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