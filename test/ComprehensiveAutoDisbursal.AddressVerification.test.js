const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Comprehensive Auto-Disbursal - Address Verification Tests", function () {
    let contract;
    let owner, victim1, victim2, victim3, unverifiedUser;
    
    // Test constants
    const LOW_RISK_AMOUNT = ethers.parseEther("0.05");
    const VALID_CID_V0 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const INITIAL_FUNDING = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, victim1, victim2, victim3, unverifiedUser] = await ethers.getSigners();
        
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
        await contract.addVerifiedVictim(victim3.address);
    });

    describe("Individual Address Operations", function () {
        it("should add verified victim successfully", async function () {
            const newVictim = ethers.Wallet.createRandom().address;
            
            await expect(
                contract.addVerifiedVictim(newVictim)
            ).to.emit(contract, "VictimAdded")
             .withArgs(newVictim);
            
            expect(await contract.isVerifiedVictim(newVictim)).to.be.true;
        });

        it("should remove verified victim successfully", async function () {
            await expect(
                contract.removeVerifiedVictim(victim1.address)
            ).to.emit(contract, "VictimRemoved")
             .withArgs(victim1.address);
            
            expect(await contract.isVerifiedVictim(victim1.address)).to.be.false;
        });

        it("should reject zero address for victim operations", async function () {
            await expect(
                contract.addVerifiedVictim(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(contract, "InvalidAddress");
        });

        it("should only allow owner to manage victims", async function () {
            const newVictim = ethers.Wallet.createRandom().address;
            
            await expect(
                contract.connect(victim1).addVerifiedVictim(newVictim)
            ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
        });
    });

    describe("Batch Address Operations", function () {
        it("should add multiple victims in batch efficiently", async function () {
            const newVictims = [
                ethers.Wallet.createRandom().address,
                ethers.Wallet.createRandom().address,
                ethers.Wallet.createRandom().address
            ];
            
            const tx = await contract.addVerifiedVictimsBatch(newVictims);
            const receipt = await tx.wait();
            
            // Check all victims were added
            for (const victim of newVictims) {
                expect(await contract.isVerifiedVictim(victim)).to.be.true;
            }
            
            // Check batch completion event
            await expect(tx)
                .to.emit(contract, "BatchOperationCompleted")
                .withArgs("ADD_VERIFIED_VICTIMS", 3, 3);
            
            // Batch should be more gas efficient than individual operations
            console.log(`Batch add victims gas used: ${receipt.gasUsed}`);
            expect(receipt.gasUsed).to.be.lt(100000);
        });

        it("should remove multiple victims in batch efficiently", async function () {
            const victimsToRemove = [victim1.address, victim2.address];
            
            const tx = await contract.removeVerifiedVictimsBatch(victimsToRemove);
            
            // Check all victims were removed
            for (const victim of victimsToRemove) {
                expect(await contract.isVerifiedVictim(victim)).to.be.false;
            }
            
            // Check batch completion event
            await expect(tx)
                .to.emit(contract, "BatchOperationCompleted")
                .withArgs("REMOVE_VERIFIED_VICTIMS", 2, 2);
        });

        it("should handle empty array in batch operations", async function () {
            await expect(
                contract.addVerifiedVictimsBatch([])
            ).to.be.revertedWithCustomError(contract, "EmptyArray");
        });

        it("should skip invalid addresses in batch operations", async function () {
            const mixedAddresses = [
                victim1.address,
                ethers.ZeroAddress, // Invalid
                victim2.address
            ];
            
            // Remove existing victims first
            await contract.removeVerifiedVictim(victim1.address);
            await contract.removeVerifiedVictim(victim2.address);
            
            const tx = await contract.addVerifiedVictimsBatch(mixedAddresses);
            
            // Should process 2 valid addresses, skip 1 invalid
            await expect(tx)
                .to.emit(contract, "BatchOperationCompleted")
                .withArgs("ADD_VERIFIED_VICTIMS", 2, 3);
            
            expect(await contract.isVerifiedVictim(victim1.address)).to.be.true;
            expect(await contract.isVerifiedVictim(victim2.address)).to.be.true;
        });
    });

    describe("Address Verification in Claims", function () {
        it("should allow verified victims to submit claims", async function () {
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
            ).to.emit(contract, "AddressVerified")
             .withArgs(0, victim1.address, true);
        });

        it("should reject claims from unverified addresses", async function () {
            await expect(
                contract.connect(unverifiedUser).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
            ).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
        });

        it("should fail fast for unverified addresses to save gas", async function () {
            // This should revert quickly without processing CID validation
            await expect(
                contract.connect(unverifiedUser).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
            ).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
        });
    });
});