// scripts/deploy.js - Deploy OSAA Token to testnet
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting OSAA Token deployment...");

  // Get the account that will deploy the contract
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Get the contract factory
  const OSAAToken = await ethers.getContractFactory("OSAAToken");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const osaaToken = await OSAAToken.deploy();

  // Wait for deployment to complete
  await osaaToken.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await osaaToken.getAddress();
  console.log("✅ OSAA Token deployed to:", contractAddress);

  // Get deployment transaction
  const deployTx = osaaToken.deploymentTransaction();
  console.log("📄 Deployment transaction hash:", deployTx?.hash);

  // Wait for confirmations before verification
  console.log("⏳ Waiting for 6 confirmations before verification...");
  if (deployTx) {
    await deployTx.wait(6);
  }

  // Get token info
  try {
    const name = await osaaToken.name();
    const symbol = await osaaToken.symbol();
    const totalSupply = await osaaToken.totalSupply();
    const ownerBalance = await osaaToken.balanceOf(deployer.address);

    console.log("\n📊 Token Information:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Total Supply:", ethers.formatUnits(totalSupply, 18), "OSAA");
    console.log("   Owner Balance:", ethers.formatUnits(ownerBalance, 18), "OSAA");
  } catch (error) {
    console.log("⚠️ Could not fetch token info:", error.message);
  }

  // Verify contract on Etherscan
  console.log("\n🔍 Attempting to verify contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Etherscan!");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
    console.log("💡 You can manually verify later using:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  }

  // Output environment variables for frontend
  console.log("\n🔧 Environment Variables for Frontend:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_NETWORK=${hre.network.name}`);

  // Output useful links
  console.log("\n🔗 Useful Links:");
  if (hre.network.name === 'sepolia') {
    console.log(`   Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log(`   Add to MetaMask: https://sepolia.etherscan.io/token/${contractAddress}`);
  } else if (hre.network.name === 'goerli') {
    console.log(`   Etherscan: https://goerli.etherscan.io/address/${contractAddress}`);
    console.log(`   Add to MetaMask: https://goerli.etherscan.io/token/${contractAddress}`);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("💡 Don't forget to update your .env.local file with the contract address!");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });