// components/MetaMaskNotice.tsx
'use client'

interface MetaMaskNoticeProps {
  isMetaMaskAvailable: boolean
}

export default function MetaMaskNotice({ isMetaMaskAvailable }: MetaMaskNoticeProps) {
  if (isMetaMaskAvailable) {
    return null // Don't render anything if MetaMask is available
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-8 shadow-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-black text-2xl">🦊</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-amber-900 mb-3">MetaMask Required</h3>
          <div className="text-amber-800 space-y-4">
            <p className="leading-relaxed">
              This dApp requires the MetaMask browser extension to interact with the Ethereum blockchain and manage your OSAA tokens.
            </p>
            
            <div className="bg-white border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-900 mb-3">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Install the MetaMask browser extension from the official website</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Create a new wallet or import an existing Ethereum wallet</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Add the Sepolia testnet to your MetaMask network list</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Get test ETH from a Sepolia faucet for transaction fees</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">5.</span>
                  <span>Refresh this page and connect your wallet</span>
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-3">
              <a 
                href="https://metamask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <span className="mr-2">🦊</span>
                Install MetaMask
              </a>
              
              <a 
                href="https://sepoliafaucet.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-3 bg-white hover:bg-gray-50 text-amber-700 border-2 border-amber-300 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                <span className="mr-2">💧</span>
                Get Test ETH
              </a>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-3 bg-white hover:bg-gray-50 text-amber-700 border-2 border-amber-300 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                <span className="mr-2">🔄</span>
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}