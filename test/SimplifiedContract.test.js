const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simplified EfficientDisasterRelief Contract", function () {
  let contract;
  let owner, addr1, addr2, ngo1;

  beforeEach(async function () {
    [owner, addr1, addr2, ngo1] = await ethers.getSigners();
    
    const EfficientDisasterRelief = await ethers.getContractFactory("contracts/simplified_smart_contract.sol:EfficientDisasterRelief");
    contract = await EfficientDisasterRelief.deploy();
    await contract.waitForDeployment();
    
    // Fund the contract
    await owner.sendTransaction({
      to: await contract.getAddress(),
      value: ethers.parseEther("10.0")
    });
    
    // Add an authorized NGO
    await contract.addAuthorizedNGO(ngo1.address);
  });

  describe("Basic Functionality", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should have correct initial balance", async function () {
      const balance = await contract.contractBalance();
      expect(balance).to.equal(ethers.parseEther("10.0"));
    });

    it("should allow donations", async function () {
      const donationAmount = ethers.parseEther("1.0");
      
      await expect(contract.connect(addr1).donate("ipfs://test-metadata", { value: donationAmount }))
        .to.emit(contract, "Donation")
        .withArgs(addr1.address, donationAmount, 0); // tokenId 0 for NFT
    });
  });

  describe("Claim Submission and Processing", function () {
    it("should allow claim submission with valid IPFS CID", async function () {
      const requestedAmount = ethers.parseEther("0.05"); // Low risk amount
      const validCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Valid IPFS v0 CID
      
      await expect(contract.connect(addr1).submitClaim(requestedAmount, validCID))
        .to.emit(contract, "ClaimSubmitted")
        .withArgs(0, addr1.address);
    });

    it("should reject claim with invalid IPFS CID", async function () {
      const requestedAmount = ethers.parseEther("0.05");
      const invalidCID = "invalid-cid-format";
      
      await expect(contract.connect(addr1).submitClaim(requestedAmount, invalidCID))
        .to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
    });

    it("should approve and auto-disburse low-risk claims", async function () {
      const requestedAmount = ethers.parseEther("0.05"); // Below threshold
      const validCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      // Submit claim
      await contract.connect(addr1).submitClaim(requestedAmount, validCID);
      
      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      
      // Approve claim (should auto-disburse)
      await expect(contract.approveClaim(0, requestedAmount))
        .to.emit(contract, "ClaimApproved")
        .withArgs(0, requestedAmount)
        .and.to.emit(contract, "FundsDisbursed")
        .withArgs(0, addr1.address, requestedAmount);
      
      // Check that funds were disbursed
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("should handle high-risk claims through NGO verification", async function () {
      const requestedAmount = ethers.parseEther("0.5"); // Above threshold
      const validCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      // Submit claim
      await contract.connect(addr1).submitClaim(requestedAmount, validCID);
      
      // NGO approves high-risk claim
      await expect(contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, requestedAmount))
        .to.emit(contract, "HighRiskClaimVerified")
        .withArgs(0, ngo1.address, requestedAmount);
    });
  });

  describe("Risk Assessment", function () {
    it("should correctly assess low-risk amounts", async function () {
      const lowAmount = ethers.parseEther("0.05");
      const [riskLevel, isLowRisk] = await contract.assessRisk(lowAmount);
      
      expect(riskLevel).to.equal("LOW");
      expect(isLowRisk).to.be.true;
    });

    it("should correctly assess high-risk amounts", async function () {
      const highAmount = ethers.parseEther("0.5");
      const [riskLevel, isLowRisk] = await contract.assessRisk(highAmount);
      
      expect(riskLevel).to.equal("HIGH");
      expect(isLowRisk).to.be.false;
    });
  });

  describe("NGO Management", function () {
    it("should allow owner to add authorized NGOs", async function () {
      await expect(contract.addAuthorizedNGO(addr2.address))
        .to.emit(contract, "NGOAdded")
        .withArgs(addr2.address);
      
      expect(await contract.isAuthorizedNGO(addr2.address)).to.be.true;
    });

    it("should allow owner to remove authorized NGOs", async function () {
      await expect(contract.removeAuthorizedNGO(ngo1.address))
        .to.emit(contract, "NGORemoved")
        .withArgs(ngo1.address);
      
      expect(await contract.isAuthorizedNGO(ngo1.address)).to.be.false;
    });
  });
});