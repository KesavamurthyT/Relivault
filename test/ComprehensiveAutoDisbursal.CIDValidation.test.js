const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Comprehensive Auto-Disbursal - CID Validation Tests", function () {
    let contract;
    let owner, victim1, victim2, unverifiedUser;
    
    // Test constants
    const LOW_RISK_AMOUNT = ethers.parseEther("0.05");
    const VALID_CID_V0 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const VALID_CID_V1 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const INVALID_CID = "invalid-cid-format";
    const EMPTY_CID = "";
    const INITIAL_FUNDING = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, victim1, victim2, unverifiedUser] = await ethers.getSigners();
        
        const EfficientDisasterRelief = await ethers.getContractFactory("EfficientDisasterRelief");
        contract = await EfficientDisasterRelief.deploy();
        await contract.waitForDeployment();
        
        // Fund the contract
        await owner.sendTransaction({
            to: await contract.getAddress(),
            value: INITIAL_FUNDING
        });
        
        // Setup initial verified victims
        await contract.addVerifiedVictim(victim1.address);
        await contract.addVerifiedVictim(victim2.address);
    });

    describe("Valid CID Formats", function () {
        it("should accept valid IPFS v0 CID (Qm...)", async function () {
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
            ).to.emit(contract, "CIDValidated")
             .withArgs(0, VALID_CID_V0, true);
            
            const claim = await contract.getClaim(0);
            expect(claim[5]).to.be.true; // cidValidated
        });

        it("should accept valid IPFS v1 CID (bafy...)", async function () {
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V1)
            ).to.emit(contract, "CIDValidated")
             .withArgs(0, VALID_CID_V1, true);
            
            const claim = await contract.getClaim(0);
            expect(claim[5]).to.be.true; // cidValidated
        });

        it("should handle multiple valid CID formats in sequence", async function () {
            // Submit with v0 CID
            await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            
            // Submit with v1 CID
            await contract.connect(victim2).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V1);
            
            const claim1 = await contract.getClaim(0);
            const claim2 = await contract.getClaim(1);
            
            expect(claim1[5]).to.be.true; // cidValidated
            expect(claim2[5]).to.be.true; // cidValidated
        });
    });

    describe("Invalid CID Formats", function () {
        it("should reject invalid CID format", async function () {
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, INVALID_CID)
            ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
        });

        it("should reject empty CID", async function () {
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, EMPTY_CID)
            ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
        });

        it("should reject CID with wrong length", async function () {
            const shortCID = "Qm123";
            const longCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdGextracharacters";
            
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, shortCID)
            ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
            
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, longCID)
            ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
        });

        it("should reject CID with invalid characters", async function () {
            const invalidCharCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPb@G";
            
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, invalidCharCID)
            ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
        });
    });

    describe("Edge Cases", function () {
        it("should handle CID validation gas efficiently", async function () {
            const tx = await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            const receipt = await tx.wait();
            
            // Gas usage should be reasonable (less than 250k for the entire transaction)
            expect(receipt.gasUsed).to.be.lt(250000);
            console.log(`CID validation gas used: ${receipt.gasUsed}`);
        });
    });
});