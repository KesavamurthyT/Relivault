const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Comprehensive Auto-Disbursal Test Suite - Sample", function () {
    let contract;
    let owner, victim1, victim2, victim3, ngo1, ngo2, donor, unverifiedUser;
    
    // Test constants
    const LOW_RISK_AMOUNT = ethers.parseEther("0.05");
    const HIGH_RISK_AMOUNT = ethers.parseEther("0.5");
    const VALID_CID_V0 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const VALID_CID_V1 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const INVALID_CID = "invalid-cid-format";
    const EMPTY_CID = "";
    const INITIAL_FUNDING = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, victim1, victim2, victim3, ngo1, ngo2, donor, unverifiedUser] = await ethers.getSigners();
        
        const EfficientDisasterRelief = await ethers.getContractFactory("contracts/simplified_smart_contract.sol:EfficientDisasterRelief");
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
        
        // Setup initial authorized NGOs
        await contract.addAuthorizedNGO(ngo1.address);
        await contract.addAuthorizedNGO(ngo2.address);
    });

    describe("1. CID Validation Tests", function () {
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
        });
    });

    describe("2. Auto-Disbursal Engine Tests", function () {
        describe("Successful Auto-Disbursal Scenarios", function () {
            it("should auto-disburse low-risk approved claims", async function () {
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                const initialBalance = await ethers.provider.getBalance(victim1.address);
                
                await expect(
                    contract.approveClaim(0, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(0, true, "Auto-disbursal successful")
                 .and.to.emit(contract, "FundsDisbursed")
                 .withArgs(0, victim1.address, LOW_RISK_AMOUNT);
                
                const finalBalance = await ethers.provider.getBalance(victim1.address);
                expect(finalBalance - initialBalance).to.equal(LOW_RISK_AMOUNT);
                
                const claim = await contract.getClaim(0);
                expect(claim[3]).to.equal(3); // ClaimStatus.DISBURSED
            });
        });
    });
});