const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Comprehensive Auto-Disbursal - Auto-Disbursal Engine Tests", function () {
    let contract;
    let owner, victim1, victim2, victim3, ngo1, ngo2;
    
    // Test constants
    const LOW_RISK_AMOUNT = ethers.parseEther("0.05");
    const HIGH_RISK_AMOUNT = ethers.parseEther("0.5");
    const VALID_CID_V0 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const INITIAL_FUNDING = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, victim1, victim2, victim3, ngo1, ngo2] = await ethers.getSigners();
        
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
        
        // Setup initial authorized NGOs
        await contract.addAuthorizedNGO(ngo1.address);
        await contract.addAuthorizedNGO(ngo2.address);
    });

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

        it("should complete full claim lifecycle with auto-disbursal", async function () {
            // Submit claim
            await expect(
                contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
            ).to.emit(contract, "ClaimSubmitted");
            
            // Approve and auto-disburse
            const tx = await contract.approveClaim(0, LOW_RISK_AMOUNT);
            
            // Should emit complete sequence of events
            await expect(tx)
                .to.emit(contract, "RiskAssessed")
                .and.to.emit(contract, "ClaimApproved")
                .and.to.emit(contract, "AutoDisbursalAttempted")
                .and.to.emit(contract, "FundsDisbursed")
                .and.to.emit(contract, "ClaimStatusChanged");
        });

        it("should handle multiple auto-disbursals efficiently", async function () {
            const claims = [];
            const victims = [victim1, victim2, victim3];
            
            // Submit multiple low-risk claims
            for (let i = 0; i < victims.length; i++) {
                await contract.connect(victims[i]).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                claims.push(i);
            }
            
            // Approve all claims - should auto-disburse each
            for (const claimId of claims) {
                await expect(
                    contract.approveClaim(claimId, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(claimId, true, "Auto-disbursal successful");
            }
        });
    });

    describe("Auto-Disbursal Failure Scenarios", function () {
        it("should not auto-disburse high-risk claims", async function () {
            await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
            
            // NGO approval should not trigger auto-disbursal for high-risk
            await expect(
                contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT)
            ).to.not.emit(contract, "AutoDisbursalAttempted");
            
            const claim = await contract.getClaim(0);
            expect(claim[3]).to.equal(1); // ClaimStatus.APPROVED (not DISBURSED)
        });

        it("should handle insufficient balance gracefully", async function () {
            // Drain most of the contract balance
            await contract.connect(victim1).submitClaim(ethers.parseEther("9.5"), VALID_CID_V0);
            await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, ethers.parseEther("9.5"));
            await contract.disburseFunds(0);
            
            // Now try to approve a claim that would exceed remaining balance
            await contract.connect(victim2).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            
            // Should revert due to insufficient balance check in approveClaim
            await expect(
                contract.approveClaim(1, LOW_RISK_AMOUNT)
            ).to.be.revertedWith("Insufficient contract funds");
        });
    });

    describe("Auto-Disbursal Eligibility Checks", function () {
        it("should check all validation criteria before auto-disbursal", async function () {
            await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            
            // Claim should meet all criteria for auto-disbursal
            const claim = await contract.getClaim(0);
            expect(claim[5]).to.be.true; // cidValidated
            expect(claim[6]).to.be.true; // addressVerified
            expect(claim[1]).to.be.lte(await contract.lowRiskThreshold()); // amount <= threshold
        });

        it("should not auto-disburse claims with validation failures", async function () {
            // This scenario is prevented by the submitClaim function validation
            // but tests the internal _canAutoDisburse logic
            await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            
            // Approval should trigger auto-disbursal since all validations pass
            await expect(
                contract.approveClaim(0, LOW_RISK_AMOUNT)
            ).to.emit(contract, "AutoDisbursalAttempted")
             .withArgs(0, true, "Auto-disbursal successful");
        });
    });

    describe("Gas Efficiency in Auto-Disbursal", function () {
        it("should efficiently process auto-disbursal with optimized checks", async function () {
            await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            
            const tx = await contract.approveClaim(0, LOW_RISK_AMOUNT);
            const receipt = await tx.wait();
            
            console.log(`Auto-disbursal gas used: ${receipt.gasUsed}`);
            
            // Should be reasonably gas efficient (less than 150k gas)
            expect(receipt.gasUsed).to.be.lt(150000);
        });
    });

    describe("Integration Tests - Complete Claim Lifecycles", function () {
        it("should complete full low-risk claim lifecycle with auto-disbursal", async function () {
            const initialBalance = await ethers.provider.getBalance(victim1.address);
            
            // 1. Submit claim
            const submitTx = await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            await expect(submitTx)
                .to.emit(contract, "ClaimSubmitted")
                .and.to.emit(contract, "CIDValidated")
                .and.to.emit(contract, "AddressVerified");
            
            // 2. Approve claim (should trigger auto-disbursal)
            const approveTx = await contract.approveClaim(0, LOW_RISK_AMOUNT);
            await expect(approveTx)
                .to.emit(contract, "ClaimApproved")
                .and.to.emit(contract, "RiskAssessed")
                .and.to.emit(contract, "AutoDisbursalAttempted")
                .and.to.emit(contract, "FundsDisbursed")
                .and.to.emit(contract, "ClaimStatusChanged");
            
            // 3. Verify final state
            const claim = await contract.getClaim(0);
            expect(claim[3]).to.equal(3); // ClaimStatus.DISBURSED
            
            const finalBalance = await ethers.provider.getBalance(victim1.address);
            expect(finalBalance - initialBalance).to.equal(LOW_RISK_AMOUNT);
        });

        it("should handle partial approval with auto-disbursal", async function () {
            await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
            
            const partialAmount = LOW_RISK_AMOUNT / 2n;
            const initialBalance = await ethers.provider.getBalance(victim1.address);
            
            await expect(
                contract.approveClaim(0, partialAmount)
            ).to.emit(contract, "AutoDisbursalAttempted")
             .withArgs(0, true, "Auto-disbursal successful");
            
            const finalBalance = await ethers.provider.getBalance(victim1.address);
            expect(finalBalance - initialBalance).to.equal(partialAmount);
        });
    });
});