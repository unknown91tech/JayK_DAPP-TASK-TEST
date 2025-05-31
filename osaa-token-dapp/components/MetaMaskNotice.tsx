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
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-yellow-400 text-xl">🦊</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-yellow-800 font-medium">MetaMask Required</h3>
          <div className="mt-2 text-yellow-700 text-sm space-y-2">
            <p>
              This dApp requires MetaMask browser extension to interact with the Ethereum blockchain.
            </p>
            
            <div className="space-y-1">
              <p className="font-medium">To get started:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs ml-4">
                <li>Install MetaMask browser extension</li>
                <li>Create or import an Ethereum wallet</li>
                <li>Add Sepolia testnet to your MetaMask</li>
                <li>Get test ETH from a Sepolia faucet</li>
                <li>Refresh this page and connect your wallet</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <a 
                href="https://metamask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium transition-colors"
              >
                🦊 Install MetaMask
              </a>
              
              <a 
                href="https://sepoliafaucet.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium transition-colors"
              >
                💧 Get Test ETH
              </a>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium transition-colors"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}