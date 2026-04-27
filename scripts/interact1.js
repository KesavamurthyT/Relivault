// scripts/interact1.js
const hre = require("hardhat");

async function main() {
  const [deployer, donor, claimant] = await hre.ethers.getSigners();

  // === UPDATE THIS ADDRESS if you redeploy ===
  const deployedAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log(`✅ Interacting with contract at: ${deployedAddress}`);

  // Load the deployed contract
  const Relief = await hre.ethers.getContractFactory("EfficientDisasterRelief");
  const relivault = Relief.attach(deployedAddress);

  // === 1. Donation without NFT (less than 1 ETH) ===
  console.log("\n💰 Small donation (no NFT)...");
  let tx = await relivault.connect(donor).donate("ipfs://small_donation.json", {
    value: hre.ethers.parseEther("0.5"),
  });
  await tx.wait();

  // === 2. Donation with NFT (>= 1 ETH) ===
  console.log("\n💎 Large donation (with NFT)...");
  tx = await relivault.connect(donor).donate("ipfs://donor_certificate.json", {
    value: hre.ethers.parseEther("1"),
  });
  await tx.wait();

  let balance = await relivault.contractBalance();
  console.log(`📊 Contract balance after donations: ${hre.ethers.formatEther(balance)} ETH`);

  // === 3. Submit a claim ===
  console.log("\n📝 Submitting claim by claimant...");
  tx = await relivault.connect(claimant).submitClaim(
    hre.ethers.parseEther("0.75"),
    "ipfs://claim_docs.json"
  );
  await tx.wait();

  const claimIds = await relivault.getClaimIds(claimant.address);
  console.log("📌 Claim IDs for claimant:", claimIds.toString());

  // === 4. Approve the claim ===
  const claimId = claimIds[0];
  console.log(`\n✅ Approving claim #${claimId} for 0.5 ETH...`);
  tx = await relivault.connect(deployer).approveClaim(claimId, hre.ethers.parseEther("0.5"));
  await tx.wait();

  // === 5. View claim details ===
  let claim = await relivault.getClaim(claimId);
  console.log("📖 Claim details after approval:", claim);

  // === 6. Disburse funds ===
  console.log(`\n💸 Disbursing claim #${claimId}...`);
  tx = await relivault.connect(deployer).disburseFunds(claimId);
  await tx.wait();

  claim = await relivault.getClaim(claimId);
  console.log("📖 Claim details after disbursement:", claim);

  balance = await relivault.contractBalance();
  console.log(`📊 Contract balance after disbursement: ${hre.ethers.formatEther(balance)} ETH`);

  // === 7. Test rejection (another claim) ===
  console.log("\n📝 Submitting second claim to test rejection...");
  tx = await relivault.connect(claimant).submitClaim(
    hre.ethers.parseEther("0.2"),
    "ipfs://rejected_claim_docs.json"
  );
  await tx.wait();

  const secondClaimId = (await relivault.getClaimIds(claimant.address))[1];
  console.log(`❌ Rejecting claim #${secondClaimId}...`);
  tx = await relivault.connect(deployer).rejectClaim(secondClaimId);
  await tx.wait();

  let rejectedClaim = await relivault.getClaim(secondClaimId);
  console.log("📖 Claim details after rejection:", rejectedClaim);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
