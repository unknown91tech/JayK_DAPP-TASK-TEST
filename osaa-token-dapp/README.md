# OSAA Token dApp

> **OneStep Authentication Asset** - A minimal yet professional blockchain dApp built with Next.js 15 for Part C of the OneStep Authentication Assignment

## 🎯 **Project Overview**

OSAA Token dApp is a decentralized application that demonstrates three core blockchain functionalities as required by Part C of the assignment:

1. **🏭 Mint Tokens** - Create new OSAA tokens (authorized users only)
2. **📤 Transfer Tokens** - Send tokens between Ethereum addresses  
3. **🔍 Check Balance** - View token balance for any address

Built with modern web technologies and following blockchain best practices, this dApp showcases professional smart contract development and frontend integration skills.

---

## 🛠 **Tech Stack**

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Integration**: ethers.js v6
- **Wallet**: MetaMask integration

### **Blockchain**
- **Platform**: Ethereum (Sepolia Testnet)
- **Language**: Solidity ^0.8.19
- **Framework**: Hardhat
- **Standards**: ERC-20 Token Standard
- **Security**: OpenZeppelin Contracts

### **Development Tools**
- **Testing**: Hardhat Test Suite
- **Deployment**: Hardhat + Etherscan Verification
- **Environment**: Node.js 18+

---


### **1. Installation**
```bash
# Clone the repository
git clone <your-repository-url>
cd osaa-token-dapp

# Install dependencies
npm install

# Install Hardhat dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### **2. Environment Setup**
Create a `.env.local` file in the root directory:
```bash
# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x206e8D8856b20b198271b1C1A413D1Ff56Bbf1D1
NEXT_PUBLIC_NETWORK=holesky

# Deployment Configuration (for contract deployment only)
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_wallet_private_key_for_deployment
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### **3. Smart Contract Deployment**
```bash
# Compile the smart contract
npx hardhat compile

# Run comprehensive tests
npx hardhat test

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Copy the deployed contract address to .env.local
```

### **4. Run the dApp**
```bash
# Start development server
npm run dev

# Open your browser to http://localhost:3000
```

### **5. MetaMask Setup**
1. Install MetaMask browser extension
2. Add Holesky testnet to MetaMask:
   - Network Name: `Holesky Testnet`
   - RPC URL: `https://ethereum-holesky.publicnode.com`
   - Chain ID: `17000`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://holesky.etherscan.io`
3. Get test ETH from [Holesky Faucet](https://faucets.chain.link/holesky)

---

## 📱 **How to Use the dApp**

### **Step 1: Connect Wallet**
1. Click **"Connect MetaMask"** button
2. Approve the connection in MetaMask
3. Ensure you're connected to Sepolia testnet

### **Step 2: Mint Tokens** (Owner/Authorized Users Only)
1. Navigate to the **Mint Tokens** section
2. Enter recipient address (or paste from clipboard)
3. Enter amount of tokens to mint
4. Click **"Mint Tokens"** and confirm in MetaMask

### **Step 3: Transfer Tokens**
1. Go to **Transfer Tokens** section
2. Enter recipient address
3. Enter amount (or use percentage buttons)
4. Click **"Transfer Tokens"** and confirm transaction

### **Step 4: Check Balance**
1. Use the **Check Balance** section
2. Enter any Ethereum address
3. Click **"Check Balance"** to view their OSAA token balance
4. No transaction required - this is a free read operation

---

## 🔧 **Smart Contract Functions**

### **Core Functions**
```solidity
// Mint new tokens (authorized users only)
function mint(address to, uint256 amount) external;

// Transfer tokens between addresses
function transfer(address to, uint256 amount) external returns (bool);

// Check token balance of any address
function balanceOf(address account) external view returns (uint256);
```

### **Security Features**
- **Access Control**: Only authorized addresses can mint tokens
- **Reentrancy Protection**: Prevents reentrancy attacks on state-changing functions
- **Input Validation**: Comprehensive validation for addresses and amounts
- **Maximum Supply**: Enforced upper limit on token supply
- **Pausable**: Emergency pause functionality for contract owner

### **Token Details**
- **Name**: OneStep Authentication Asset
- **Symbol**: OSAA
- **Decimals**: 18
- **Initial Supply**: 1,000,000 OSAA tokens
- **Maximum Supply**: 10,000,000 OSAA tokens

---

## 📊 **Testing**

### **Run Tests**
```bash
# Run all contract tests
npx hardhat test test/OSAAToken.test.js
```

### **Test Coverage**
- ✅ **Deployment**: Contract initialization and ownership
- ✅ **Minting**: Authorized and unauthorized minting scenarios
- ✅ **Transfers**: Valid transfers, insufficient balance, zero address
- ✅ **Balance Checking**: Correct balance retrieval and edge cases
- ✅ **Access Control**: Authorization management
- ✅ **Security**: Reentrancy protection and input validation

---

## 🌐 **Deployment**

### **Contract Deployment**
The smart contract is deployed on **Holesky Testnet** with the following features:
- **Contract Address**: `0x206e8D8856b20b198271b1C1A413D1Ff56Bbf1D1`
- **Network**: Holesky Testnet (Chain ID: 17000)
- **Automated Deployment**: Single command deployment script
- **Etherscan Verification**: Automatic source code verification
- **Gas Optimization**: Optimized for minimal gas consumption


#### **Manual Build**
```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 **Project Structure**

```
osaa-token-dapp/
├── 📁 app/                           # Next.js 15 App Router
│   ├── globals.css                   # Global styles with Tailwind
│   ├── layout.tsx                    # Root layout component
│   └── page.tsx                      # Main dApp interface
├── 📁 components/                    # React components
│   ├── WalletConnector.tsx          # Wallet connection interface
│   ├── TokenMinter.tsx              # Token minting component
│   ├── TokenTransfer.tsx            # Token transfer component
│   ├── BalanceChecker.tsx           # Balance checking component
│   ├── StatusMessage.tsx            # Status message display
│   └── MetaMaskNotice.tsx           # MetaMask installation notice
├── 📁 contracts/                     # Smart contracts
│   └── OSAAToken.sol                # ERC-20 token contract
├── 📁 scripts/                       # Deployment scripts
│   └── deploy.js                    # Contract deployment script
├── 📁 test/                         # Test files
│   └── OSAAToken.test.js            # Comprehensive contract tests
├── hardhat.config.js                # Hardhat configuration
├── next.config.js                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── package.json                     # Project dependencies
└── README.md                        # This file
```

---

## 🔗 **Links & Resources**

### **Live Demo**
- 🌐 **dApp**: https://test6-day6-for-me-pf6g.vercel.app/
- 📜 **Contract**: https://holesky.etherscan.io/address/0x206e8D8856b20b198271b1C1A413D1Ff56Bbf1D1
- 📊 **Token Info**: https://holesky.etherscan.io/token/0x206e8D8856b20b198271b1C1A413D1Ff56Bbf1D1

### **Development Resources**
- 🦊 **MetaMask**: https://metamask.io/
- 💧 **Holesky Faucet**: https://faucets.chain.link/holesky
- 🔍 **Holesky Explorer**: https://holesky.etherscan.io/
- 📚 **Next.js Docs**: https://nextjs.org/docs
- ⚡ **Hardhat Docs**: https://hardhat.org/docs

### **Assignment Context**
This dApp is built as **Part C** of the OneStep Authentication Assignment, demonstrating:
- Smart contract development skills
- Frontend blockchain integration
- Professional dApp user experience
- Security best practices implementation

---


## 🛠 **Troubleshooting**

### **Common Issues**

#### **"MetaMask not detected"**
- **Solution**: Install MetaMask browser extension from https://metamask.io/
- **Alternative**: Use a MetaMask-compatible browser

#### **"Wrong network" error**
- **Solution**: Switch MetaMask to Holesky testnet
- **Steps**: MetaMask → Network dropdown → Add Holesky testnet

#### **"Insufficient funds for gas"**
- **Solution**: Get test ETH from Holesky faucet
- **Link**: https://faucets.chain.link/holesky

#### **"Transaction failed" errors**
- **Causes**: Insufficient gas, contract revert, network congestion
- **Solutions**: 
  - Increase gas limit in MetaMask
  - Check contract function requirements
  - Wait and retry during low network usage

#### **"Not authorized to mint" error**
- **Cause**: Your address is not authorized to mint tokens
- **Solution**: Only the contract owner can mint tokens initially

### **Getting Help**
1. **Check Browser Console**: Look for detailed error messages
2. **Verify Environment**: Ensure `.env.local` has correct contract address
3. **Test Network**: Confirm you're on Holesky testnet
4. **Gas Fees**: Ensure sufficient test ETH for transactions

---

## 🔒 **Security Considerations**

### **Smart Contract Security**
- **OpenZeppelin**: Using battle-tested security patterns
- **Access Control**: Role-based permissions for sensitive functions
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Input Validation**: Comprehensive validation for all inputs
- **Integer Overflow**: SafeMath patterns and Solidity 0.8+ built-in protection

### **Frontend Security**
- **Environment Variables**: Sensitive data in environment variables only
- **Validation**: Client-side and contract-side input validation
- **Error Handling**: Secure error messages without exposing sensitive data

---



## 👨‍💻 **Assignment Context**

### **Part C Requirements Fulfilled**
✅ **Smart Contract Development**
- ERC-20 token with minting, transferring, and balance checking
- Security features and access control implementation
- Comprehensive testing suite with edge cases

✅ **Frontend Development** 
- Next.js 15 React application with TypeScript
- MetaMask wallet integration
- Professional user interface with error handling

✅ **Deployment & Testing**
- Sepolia testnet deployment with Etherscan verification
- Live dApp hosted with working functionality
- Complete test coverage and documentation

✅ **Professional Presentation**
- Clean, modular code architecture
- Comprehensive documentation
- Demo videos showcasing all functionality

### **Technical Excellence Demonstrated**
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Security First**: OpenZeppelin contracts, comprehensive validation
- **User Experience**: Intuitive interface, helpful error messages
- **Code Quality**: Modular components, comprehensive testing
- **Documentation**: Professional README with setup instructions
