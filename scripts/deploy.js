async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const DisasterRelief = await ethers.getContractFactory("EfficientDisasterRelief");
  const contract = await DisasterRelief.deploy(deployer.address); // pass initialOwner

  await contract.waitForDeployment();
  console.log("✅ Contract deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
