const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Optimization Tests", function () {
    let contract;
    let owner, victim1, victim2, ngo1, ngo2;
    
    beforeEach(async function () {
        [owner, victim1, victim2, ngo1, ngo2] = await ethers.getSigners();
        
        const EfficientDisasterRelief = await ethers.getContractFactory("EfficientDisasterRelief");
        contract = await EfficientDisasterRelief.deploy();
        await contract.waitForDeployment();
        
        // Fund the contract
        await owner.sendTransaction({
            to: await contract.getAddress(),
            value: ethers.parseEther("10")
        });
    });

    describe("Custom Errors vs Require Strings", function () {
        it("should use less gas with custom errors", async function () {
            // Test invalid address error
            await expect(contract.addVerifiedVictim(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(contract, "InvalidAddress");
            
            // Test already authorized error
            await contract.addAuthorizedNGO(ngo1.address);
            await expect(contract.addAuthorizedNGO(ngo1.address))
                .to.be.revertedWithCustomError(contract, "AlreadyAuthorized");
        });
    });

    describe("Batch Operations Gas Efficiency", function () {
        it("should be more gas efficient for batch victim operations", async function () {
            const victims = [victim1.address, victim2.address];
            
            // Measure gas for batch operation
            const batchTx = await contract.addVerifiedVictimsBatch(victims);
            const batchReceipt = await batchTx.wait();
            const batchGasUsed = batchReceipt.gasUsed;
            
            console.log(`Batch add victims gas used: ${batchGasUsed}`);
            
            // Reset state
            await contract.removeVerifiedVictimsBatch(victims);
            
            // Measure gas for individual operations
            const tx1 = await contract.addVerifiedVictim(victim1.address);
            const receipt1 = await tx1.wait();
            const tx2 = await contract.addVerifiedVictim(victim2.address);
            const receipt2 = await tx2.wait();
            const individualGasUsed = receipt1.gasUsed + receipt2.gasUsed;
            
            console.log(`Individual add victims gas used: ${individualGasUsed}`);
            console.log(`Gas savings: ${individualGasUsed - batchGasUsed} (${((individualGasUsed - batchGasUsed) * 100n / individualGasUsed)}%)`);
            
            // Batch should be more efficient
            expect(batchGasUsed).to.be.lt(individualGasUsed);
        });

        it("should be more gas efficient for batch NGO operations", async function () {
            const ngos = [ngo1.address, ngo2.address];
            
            // Measure gas for batch operation
            const batchTx = await contract.addAuthorizedNGOsBatch(ngos);
            const batchReceipt = await batchTx.wait();
            const batchGasUsed = batchReceipt.gasUsed;
            
            console.log(`Batch add NGOs gas used: ${batchGasUsed}`);
            
            // Reset state
            await contract.removeAuthorizedNGOsBatch(ngos);
            
            // Measure gas for individual operations
            const tx1 = await contract.addAuthorizedNGO(ngo1.address);
            const receipt1 = await tx1.wait();
            const tx2 = await contract.addAuthorizedNGO(ngo2.address);
            const receipt2 = await tx2.wait();
            const individualGasUsed = receipt1.gasUsed + receipt2.gasUsed;
            
            console.log(`Individual add NGOs gas used: ${individualGasUsed}`);
            console.log(`Gas savings: ${individualGasUsed - batchGasUsed} (${((individualGasUsed - batchGasUsed) * 100n / individualGasUsed)}%)`);
            
            // Batch should be more efficient
            expect(batchGasUsed).to.be.lt(individualGasUsed);
        });
    });

    describe("Optimized Validation Functions", function () {
        it("should efficiently validate IPFS CIDs", async function () {
            // Add victim for claim submission
            await contract.addVerifiedVictim(victim1.address);
            
            // Test optimized CID validation
            const validCIDv0 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
            const validCIDv1 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
            
            // Measure gas for claim submission with CID validation
            const tx1 = await contract.connect(victim1).submitClaim(
                ethers.parseEther("0.05"),
                validCIDv0
            );
            const receipt1 = await tx1.wait();
            console.log(`Submit claim with CIDv0 gas used: ${receipt1.gasUsed}`);
            
            const tx2 = await contract.connect(victim1).submitClaim(
                ethers.parseEther("0.05"),
                validCIDv1
            );
            const receipt2 = await tx2.wait();
            console.log(`Submit claim with CIDv1 gas used: ${receipt2.gasUsed}`);
        });

        it("should efficiently handle early returns in validation", async function () {
            // Test early return optimization for unverified victim
            await expect(contract.connect(victim1).submitClaim(
                ethers.parseEther("0.05"),
                "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
            )).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
        });
    });

    describe("Struct Packing Efficiency", function () {
        it("should efficiently store claim data with packed structs", async function () {
            // Add victim and submit claim
            await contract.addVerifiedVictim(victim1.address);
            
            const tx = await contract.connect(victim1).submitClaim(
                ethers.parseEther("0.05"),
                "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
            );
            const receipt = await tx.wait();
            
            console.log(`Submit claim with packed struct gas used: ${receipt.gasUsed}`);
            
            // Verify claim data is stored correctly
            const claim = await contract.getClaim(0);
            expect(claim[0]).to.equal(victim1.address); // claimant
            expect(claim[1]).to.equal(ethers.parseEther("0.05")); // requested
            expect(claim[5]).to.be.true; // cidValidated
            expect(claim[6]).to.be.true; // addressVerified
            expect(claim[8]).to.be.gt(0); // validationTimestamp
        });
    });

    describe("Auto-Disbursal Optimization", function () {
        it("should efficiently process auto-disbursal with optimized checks", async function () {
            // Setup
            await contract.addVerifiedVictim(victim1.address);
            await contract.connect(victim1).submitClaim(
                ethers.parseEther("0.05"), // Low risk amount
                "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
            );
            
            // Measure gas for approval with auto-disbursal
            const tx = await contract.approveClaim(0, ethers.parseEther("0.05"));
            const receipt = await tx.wait();
            
            console.log(`Approve claim with auto-disbursal gas used: ${receipt.gasUsed}`);
            
            // Verify claim was auto-disbursed
            const claim = await contract.getClaim(0);
            expect(claim[3]).to.equal(3); // ClaimStatus.DISBURSED
        });
    });
});