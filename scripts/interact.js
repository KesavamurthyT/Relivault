async function main() {
  const contractAddress = "0x8c86DDC1109D68328C9763851ff71e33800bEFDb";
  const contract = await ethers.getContractAt("ReliefFund", contractAddress);
  const [admin] = await ethers.getSigners();

  console.log("✅ Donating 0.0001 MATIC...");
  await contract.connect(admin).donate({ value: ethers.parseEther("0.0001") });

  console.log("Contract Balance:", (await contract.getBalance()).toString());

  const victim = "0x7ceBA7009c5f1d6faD9323FE0B3bcE8e4b92F05f";
  console.log("✅ Verifying victim...");
  await contract.verifyVictim(victim);

  console.log("✅ Disbursing 0.00005 MATIC to victim...");
  await contract.disburse(victim, ethers.parseEther("0.00005"));

  console.log("New Contract Balance:", (await contract.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
