const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Simplified EfficientDisasterRelief Contract...");
  
  // Get the contract factory - specify the simplified contract
  const EfficientDisasterRelief = await ethers.getContractFactory("contracts/simplified_smart_contract.sol:EfficientDisasterRelief");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const contract = await EfficientDisasterRelief.deploy();
  
  // Wait for deployment to complete
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Network:", network.name);
  
  // Fund the contract with some initial ETH for testing
  console.log("💰 Funding contract with initial ETH...");
  const [deployer] = await ethers.getSigners();
  
  const fundingAmount = ethers.parseEther("5.0"); // 5 ETH for testing
  const fundTx = await deployer.sendTransaction({
    to: contractAddress,
    value: fundingAmount
  });
  
  await fundTx.wait();
  console.log(`✅ Contract funded with ${ethers.formatEther(fundingAmount)} ETH`);
  
  // Add some initial NGOs for testing
  console.log("👥 Adding initial NGO addresses...");
  
  // You can add your NGO addresses here
  const ngoAddresses = [
    // Add your NGO wallet addresses here
    // "0x...", 
    // "0x...",
  ];
  
  for (const ngoAddress of ngoAddresses) {
    try {
      const tx = await contract.addAuthorizedNGO(ngoAddress);
      await tx.wait();
      console.log(`✅ Added NGO: ${ngoAddress}`);
    } catch (error) {
      console.log(`❌ Failed to add NGO ${ngoAddress}:`, error.message);
    }
  }
  
  // Display contract info
  console.log("\n📋 Contract Information:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Contract Balance: ${ethers.formatEther(fundingAmount)} ETH`);
  console.log(`Low Risk Threshold: ${ethers.formatEther(await contract.lowRiskThreshold())} ETH`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n🎉 Deployment Complete!");
  console.log("📝 Next Steps:");
  console.log("1. Update your frontend with the new contract address");
  console.log("2. Update the RELIEF_CONTRACT_ADDRESS in hooks/useReliefContract.ts");
  console.log("3. Test claim submission without verification requirements");
  console.log("4. Add NGO addresses using addAuthorizedNGO() if needed");
  
  // Save deployment info to file
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: network.name,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    fundingAmount: ethers.formatEther(fundingAmount),
    lowRiskThreshold: ethers.formatEther(await contract.lowRiskThreshold())
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-info.json");

  // Save contract address to .env file for backend scripts
  fs.writeFileSync('.env', `CONTRACT_ADDRESS=${contractAddress}`);
  console.log("🔑 Contract address saved to .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });