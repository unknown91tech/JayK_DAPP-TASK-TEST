'use client'

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mb-8">
      {!account ? (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🦊</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Connect your MetaMask wallet to interact with OSAA tokens on the Ethereum blockchain
          </p>
          <button
            onClick={onConnect}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center mx-auto transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
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
                <span className="mr-2">🦊</span>
                Connect MetaMask
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Wallet Connected</h2>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full">Connected</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">👤</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">Account Address</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <p className="font-mono text-sm text-gray-800 break-all mb-2">
                  {account}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(account)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                >
                  📋 Copy Address
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-emerald-600 text-sm">💰</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">OSAA Token Balance</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-emerald-700">
                  {parseFloat(balance).toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 font-medium">OSAA Tokens</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}