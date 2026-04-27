// scripts/deploy1.js
const hre = require("hardhat");

async function main() {
  // Fully qualified name to avoid multiple artifacts
  const Relivault = await hre.ethers.getContractFactory(
    "contracts/final_smart_contract.sol:EfficientDisasterRelief"
  );

  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying with account:", deployer.address);

  // Deploy
  const relivault = await Relivault.deploy();
  await relivault.waitForDeployment();

  console.log(`✅ Contract deployed at: ${relivault.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
