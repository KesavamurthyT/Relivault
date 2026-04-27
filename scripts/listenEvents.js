const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS; 
  const contractABI = require("../artifacts/contracts/simplified_smart_contract.sol/EfficientDisasterRelief.json").abi;

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // Hardhat/Localhost
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  console.log("Listening for contract events...");

  // Listen for Donation events
  contract.on("Donation", (donor, amount, tokenId, event) => {
    console.log(`💰 Donation from ${donor} of amount: ${ethers.formatEther(amount)} ETH. TokenID: ${tokenId}`);
    // TODO: Save this to DB / Firebase
  });

  // Listen for ClaimSubmitted events
  contract.on("ClaimSubmitted", (claimId, claimant, event) => {
    console.log(`📄 Claim #${claimId} submitted by ${claimant}`);
    // TODO: Save this to DB / Firebase
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
