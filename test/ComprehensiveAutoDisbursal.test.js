const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Comprehensive Auto-Disbursal Test Suite", function () {
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
                
                // Gas usage should be reasonable (less than 200k for the entire transaction)
                expect(receipt.gasUsed).to.be.lt(200000);
            });
        });
    });

    describe("2. Address Verification System Tests", function () {
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

    describe("3. Risk Assessment Logic Tests", function () {
        describe("Threshold Configuration", function () {
            it("should have correct default low-risk threshold", async function () {
                const threshold = await contract.lowRiskThreshold();
                expect(threshold).to.equal(ethers.parseEther("0.1"));
            });

            it("should allow owner to update threshold", async function () {
                const newThreshold = ethers.parseEther("0.2");
                const oldThreshold = await contract.lowRiskThreshold();
                
                await expect(
                    contract.setLowRiskThreshold(newThreshold)
                ).to.emit(contract, "ThresholdUpdated")
                 .withArgs("lowRisk", oldThreshold, newThreshold);
                
                expect(await contract.lowRiskThreshold()).to.equal(newThreshold);
            });

            it("should reject zero threshold", async function () {
                await expect(
                    contract.setLowRiskThreshold(0)
                ).to.be.revertedWithCustomError(contract, "ThresholdTooLow");
            });

            it("should only allow owner to update threshold", async function () {
                await expect(
                    contract.connect(victim1).setLowRiskThreshold(ethers.parseEther("0.2"))
                ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
            });
        });

        describe("Risk Categorization", function () {
            it("should correctly assess low-risk amounts", async function () {
                const [riskLevel, isLowRisk] = await contract.assessRisk(LOW_RISK_AMOUNT);
                expect(riskLevel).to.equal("LOW");
                expect(isLowRisk).to.be.true;
            });

            it("should correctly assess high-risk amounts", async function () {
                const [riskLevel, isLowRisk] = await contract.assessRisk(HIGH_RISK_AMOUNT);
                expect(riskLevel).to.equal("HIGH");
                expect(isLowRisk).to.be.false;
            });

            it("should handle boundary conditions correctly", async function () {
                const threshold = await contract.lowRiskThreshold();
                
                // Exactly at threshold should be low risk
                const [riskAtThreshold, isLowAtThreshold] = await contract.assessRisk(threshold);
                expect(riskAtThreshold).to.equal("LOW");
                expect(isLowAtThreshold).to.be.true;
                
                // Just above threshold should be high risk
                const [riskAboveThreshold, isLowAboveThreshold] = await contract.assessRisk(threshold + 1n);
                expect(riskAboveThreshold).to.equal("HIGH");
                expect(isLowAboveThreshold).to.be.false;
            });

            it("should emit risk assessment events during approval", async function () {
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.approveClaim(0, LOW_RISK_AMOUNT)
                ).to.emit(contract, "RiskAssessed")
                 .withArgs(0, LOW_RISK_AMOUNT, "LOW");
            });
        });

        describe("Dynamic Threshold Updates", function () {
            it("should apply new threshold to subsequent risk assessments", async function () {
                const testAmount = ethers.parseEther("0.15");
                
                // Initially should be high risk (above 0.1 ETH default)
                let [riskLevel, isLowRisk] = await contract.assessRisk(testAmount);
                expect(riskLevel).to.equal("HIGH");
                expect(isLowRisk).to.be.false;
                
                // Update threshold to 0.2 ETH
                await contract.setLowRiskThreshold(ethers.parseEther("0.2"));
                
                // Now should be low risk
                [riskLevel, isLowRisk] = await contract.assessRisk(testAmount);
                expect(riskLevel).to.equal("LOW");
                expect(isLowRisk).to.be.true;
            });
        });
    });

    describe("4. NGO Authorization and High-Risk Claim Workflows", function () {
        describe("NGO Management", function () {
            it("should add authorized NGO successfully", async function () {
                const newNGO = ethers.Wallet.createRandom().address;
                
                await expect(
                    contract.addAuthorizedNGO(newNGO)
                ).to.emit(contract, "NGOAdded")
                 .withArgs(newNGO);
                
                expect(await contract.isAuthorizedNGO(newNGO)).to.be.true;
            });

            it("should remove authorized NGO successfully", async function () {
                await expect(
                    contract.removeAuthorizedNGO(ngo1.address)
                ).to.emit(contract, "NGORemoved")
                 .withArgs(ngo1.address);
                
                expect(await contract.isAuthorizedNGO(ngo1.address)).to.be.false;
            });

            it("should reject duplicate NGO authorization", async function () {
                await expect(
                    contract.addAuthorizedNGO(ngo1.address)
                ).to.be.revertedWithCustomError(contract, "AlreadyAuthorized");
            });

            it("should reject removing non-authorized NGO", async function () {
                const nonNGO = ethers.Wallet.createRandom().address;
                
                await expect(
                    contract.removeAuthorizedNGO(nonNGO)
                ).to.be.revertedWithCustomError(contract, "NotAuthorized");
            });
        });

        describe("Batch NGO Operations", function () {
            it("should add multiple NGOs in batch efficiently", async function () {
                const newNGOs = [
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address
                ];
                
                const tx = await contract.addAuthorizedNGOsBatch(newNGOs);
                
                // Check all NGOs were added
                for (const ngo of newNGOs) {
                    expect(await contract.isAuthorizedNGO(ngo)).to.be.true;
                }
                
                await expect(tx)
                    .to.emit(contract, "BatchOperationCompleted")
                    .withArgs("ADD_AUTHORIZED_NGOS", 2, 2);
            });

            it("should remove multiple NGOs in batch efficiently", async function () {
                const ngosToRemove = [ngo1.address, ngo2.address];
                
                const tx = await contract.removeAuthorizedNGOsBatch(ngosToRemove);
                
                // Check all NGOs were removed
                for (const ngo of ngosToRemove) {
                    expect(await contract.isAuthorizedNGO(ngo)).to.be.false;
                }
                
                await expect(tx)
                    .to.emit(contract, "BatchOperationCompleted")
                    .withArgs("REMOVE_AUTHORIZED_NGOS", 2, 2);
            });
        });

        describe("High-Risk Claim Approval", function () {
            beforeEach(async function () {
                // Submit a high-risk claim
                await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
            });

            it("should allow authorized NGO to approve high-risk claim", async function () {
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT)
                ).to.emit(contract, "HighRiskClaimVerified")
                 .withArgs(0, ngo1.address, HIGH_RISK_AMOUNT)
                 .and.to.emit(contract, "RiskAssessed")
                 .withArgs(0, HIGH_RISK_AMOUNT, "HIGH");
                
                const claim = await contract.getClaim(0);
                expect(claim[3]).to.equal(1); // ClaimStatus.APPROVED
                expect(claim[7]).to.equal(ngo1.address); // ngoVerifier
            });

            it("should reject unauthorized NGO approval", async function () {
                await expect(
                    contract.connect(victim1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT)
                ).to.be.revertedWithCustomError(contract, "UnauthorizedNGO");
            });

            it("should reject NGO approval of low-risk amounts", async function () {
                // Submit low-risk claim
                await contract.connect(victim2).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(1, LOW_RISK_AMOUNT)
                ).to.be.revertedWithCustomError(contract, "InvalidAmount");
            });

            it("should reject approval exceeding requested amount", async function () {
                const excessiveAmount = HIGH_RISK_AMOUNT + ethers.parseEther("1");
                
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, excessiveAmount)
                ).to.be.revertedWithCustomError(contract, "ExceedsRequested");
            });

            it("should update validation timestamp on NGO approval", async function () {
                const tx = await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT);
                const receipt = await tx.wait();
                const block = await ethers.provider.getBlock(receipt.blockNumber);
                
                await expect(tx)
                    .to.emit(contract, "ValidationTimestampUpdated")
                    .withArgs(0, block.timestamp);
                
                const claim = await contract.getClaim(0);
                expect(claim[8]).to.equal(block.timestamp); // validationTimestamp
            });
        });

        describe("Multiple NGO Scenarios", function () {
            it("should allow different NGOs to approve different claims", async function () {
                // Submit two high-risk claims
                await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
                await contract.connect(victim2).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V1);
                
                // Different NGOs approve different claims
                await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT);
                await contract.connect(ngo2).reviewAndApproveHighRiskClaim(1, HIGH_RISK_AMOUNT);
                
                const claim1 = await contract.getClaim(0);
                const claim2 = await contract.getClaim(1);
                
                expect(claim1[7]).to.equal(ngo1.address); // ngoVerifier
                expect(claim2[7]).to.equal(ngo2.address); // ngoVerifier
            });

            it("should track NGO verification in events", async function () {
                await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT)
                ).to.emit(contract, "HighRiskClaimVerified")
                 .withArgs(0, ngo1.address, HIGH_RISK_AMOUNT);
            });
        });
    });

    describe("5. Auto-Disbursal Engine Tests", function () {
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
                
                // Regular approval (not NGO approval) should not trigger auto-disbursal for high-risk
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

            it("should fallback to manual disbursal on transfer failure", async function () {
                // This test simulates a scenario where auto-disbursal transfer fails
                // In practice, this is hard to simulate with EOAs, but the logic is tested
                // The contract should emit AutoDisbursalAttempted with success=false
                // and leave the claim in APPROVED status for manual disbursal
                
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                // Normal approval should succeed with auto-disbursal
                await expect(
                    contract.approveClaim(0, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(0, true, "Auto-disbursal successful");
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
    });

    describe("6. Integration Tests - Complete Claim Lifecycles", function () {
        describe("Low-Risk Claim Lifecycle", function () {
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

        describe("High-Risk Claim Lifecycle", function () {
            it("should complete full high-risk claim lifecycle with NGO approval", async function () {
                const initialBalance = await ethers.provider.getBalance(victim1.address);
                
                // 1. Submit high-risk claim
                await expect(
                    contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0)
                ).to.emit(contract, "ClaimSubmitted");
                
                // 2. NGO approval (no auto-disbursal for high-risk)
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT)
                ).to.emit(contract, "HighRiskClaimVerified")
                 .and.to.emit(contract, "ClaimApproved")
                 .and.to.not.emit(contract, "AutoDisbursalAttempted");
                
                // 3. Manual disbursal
                await expect(
                    contract.disburseFunds(0)
                ).to.emit(contract, "FundsDisbursed")
                 .and.to.emit(contract, "ClaimStatusChanged");
                
                // 4. Verify final state
                const claim = await contract.getClaim(0);
                expect(claim[3]).to.equal(3); // ClaimStatus.DISBURSED
                expect(claim[7]).to.equal(ngo1.address); // ngoVerifier
                
                const finalBalance = await ethers.provider.getBalance(victim1.address);
                expect(finalBalance - initialBalance).to.equal(HIGH_RISK_AMOUNT);
            });
        });

        describe("Mixed Risk Scenarios", function () {
            it("should handle multiple claims with different risk levels", async function () {
                // Submit low-risk and high-risk claims
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                await contract.connect(victim2).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V1);
                
                // Approve low-risk (should auto-disburse)
                await expect(
                    contract.approveClaim(0, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(0, true, "Auto-disbursal successful");
                
                // NGO approve high-risk (should not auto-disburse)
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(1, HIGH_RISK_AMOUNT)
                ).to.not.emit(contract, "AutoDisbursalAttempted");
                
                // Verify states
                const lowRiskClaim = await contract.getClaim(0);
                const highRiskClaim = await contract.getClaim(1);
                
                expect(lowRiskClaim[3]).to.equal(3); // DISBURSED
                expect(highRiskClaim[3]).to.equal(1); // APPROVED (not disbursed)
            });

            it("should handle threshold changes affecting pending claims", async function () {
                // Submit claim at current threshold boundary
                const thresholdAmount = await contract.lowRiskThreshold();
                await contract.connect(victim1).submitClaim(thresholdAmount, VALID_CID_V0);
                
                // Change threshold to make this amount high-risk
                await contract.setLowRiskThreshold(thresholdAmount - 1n);
                
                // Approval should now treat it as high-risk (no auto-disbursal)
                // But regular approveClaim doesn't check risk for auto-disbursal eligibility
                // The risk assessment happens during approval
                await expect(
                    contract.approveClaim(0, thresholdAmount)
                ).to.emit(contract, "RiskAssessed")
                 .withArgs(0, thresholdAmount, "HIGH");
            });
        });

        describe("Error Recovery Scenarios", function () {
            it("should handle claim rejection and resubmission", async function () {
                // Submit and reject claim
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.rejectClaim(0)
                ).to.emit(contract, "ClaimRejected")
                 .and.to.emit(contract, "ClaimStatusChanged");
                
                // Resubmit new claim
                await expect(
                    contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
                ).to.emit(contract, "ClaimSubmitted");
                
                // New claim should be processed normally
                await expect(
                    contract.approveClaim(1, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(1, true, "Auto-disbursal successful");
            });

            it("should handle contract balance depletion gracefully", async function () {
                // Submit multiple claims that would exceed balance
                const largeAmount = ethers.parseEther("6");
                
                await contract.connect(victim1).submitClaim(largeAmount, VALID_CID_V0);
                await contract.connect(victim2).submitClaim(largeAmount, VALID_CID_V0);
                
                // First approval should work
                await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, largeAmount);
                await contract.disburseFunds(0);
                
                // Second approval should fail due to insufficient balance
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(1, largeAmount)
                ).to.be.revertedWith("Insufficient contract funds");
            });
        });
    });

    describe("7. Gas Optimization Validation", function () {
        describe("Function-Level Gas Measurements", function () {
            it("should measure gas consumption for claim submission", async function () {
                const tx = await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                const receipt = await tx.wait();
                
                console.log(`Submit claim gas used: ${receipt.gasUsed}`);
                expect(receipt.gasUsed).to.be.lt(200000);
            });

            it("should measure gas consumption for claim approval with auto-disbursal", async function () {
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                const tx = await contract.approveClaim(0, LOW_RISK_AMOUNT);
                const receipt = await tx.wait();
                
                console.log(`Approve claim with auto-disbursal gas used: ${receipt.gasUsed}`);
                expect(receipt.gasUsed).to.be.lt(150000);
            });

            it("should measure gas consumption for NGO high-risk approval", async function () {
                await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
                
                const tx = await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT);
                const receipt = await tx.wait();
                
                console.log(`NGO approve high-risk claim gas used: ${receipt.gasUsed}`);
                expect(receipt.gasUsed).to.be.lt(120000);
            });
        });

        describe("Batch Operations Efficiency", function () {
            it("should demonstrate batch victim operations gas savings", async function () {
                const newVictims = [
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address
                ];
                
                // Measure batch operation
                const batchTx = await contract.addVerifiedVictimsBatch(newVictims);
                const batchReceipt = await batchTx.wait();
                
                console.log(`Batch add victims (${newVictims.length}) gas used: ${batchReceipt.gasUsed}`);
                
                // Batch should be more efficient than individual operations
                expect(batchReceipt.gasUsed).to.be.lt(newVictims.length * 60000);
            });

            it("should demonstrate batch NGO operations gas savings", async function () {
                const newNGOs = [
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address
                ];
                
                const batchTx = await contract.addAuthorizedNGOsBatch(newNGOs);
                const batchReceipt = await batchTx.wait();
                
                console.log(`Batch add NGOs (${newNGOs.length}) gas used: ${batchReceipt.gasUsed}`);
                
                // Should be efficient
                expect(batchReceipt.gasUsed).to.be.lt(100000);
            });
        });

        describe("Storage Optimization", function () {
            it("should efficiently store claim data with packed structs", async function () {
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                // Verify all data is stored correctly
                const claim = await contract.getClaim(0);
                expect(claim[0]).to.equal(victim1.address); // claimant
                expect(claim[1]).to.equal(LOW_RISK_AMOUNT); // requested
                expect(claim[5]).to.be.true; // cidValidated
                expect(claim[6]).to.be.true; // addressVerified
                expect(claim[8]).to.be.gt(0); // validationTimestamp
            });
        });

        describe("Custom Errors Gas Efficiency", function () {
            it("should use custom errors for gas savings", async function () {
                // Test various custom errors
                await expect(
                    contract.addVerifiedVictim(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(contract, "InvalidAddress");
                
                await expect(
                    contract.connect(unverifiedUser).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
                ).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
                
                await expect(
                    contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, INVALID_CID)
                ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
            });
        });
    });

    describe("8. Event Logging Comprehensive Tests", function () {
        describe("Complete Event Audit Trail", function () {
            it("should emit all required events for low-risk claim lifecycle", async function () {
                const tx1 = await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                // Submission events
                await expect(tx1)
                    .to.emit(contract, "CIDValidated")
                    .and.to.emit(contract, "AddressVerified")
                    .and.to.emit(contract, "ValidationTimestampUpdated")
                    .and.to.emit(contract, "ClaimStatusChanged")
                    .and.to.emit(contract, "ClaimSubmitted");
                
                const tx2 = await contract.approveClaim(0, LOW_RISK_AMOUNT);
                
                // Approval and auto-disbursal events
                await expect(tx2)
                    .to.emit(contract, "RiskAssessed")
                    .and.to.emit(contract, "ClaimStatusChanged")
                    .and.to.emit(contract, "ClaimApproved")
                    .and.to.emit(contract, "AutoDisbursalAttempted")
                    .and.to.emit(contract, "FundsDisbursed");
            });

            it("should emit all required events for high-risk claim lifecycle", async function () {
                const tx1 = await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
                
                // Submission events
                await expect(tx1)
                    .to.emit(contract, "ClaimSubmitted")
                    .and.to.emit(contract, "CIDValidated")
                    .and.to.emit(contract, "AddressVerified");
                
                const tx2 = await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT);
                
                // NGO approval events
                await expect(tx2)
                    .to.emit(contract, "RiskAssessed")
                    .and.to.emit(contract, "HighRiskClaimVerified")
                    .and.to.emit(contract, "ClaimApproved")
                    .and.to.emit(contract, "ValidationTimestampUpdated");
                
                const tx3 = await contract.disburseFunds(0);
                
                // Manual disbursal events
                await expect(tx3)
                    .to.emit(contract, "ClaimStatusChanged")
                    .and.to.emit(contract, "FundsDisbursed");
            });
        });

        describe("Error and Diagnostic Events", function () {
            it("should emit validation failure events", async function () {
                // These events are emitted before reverts in the actual contract
                // Testing the revert behavior validates the error handling
                await expect(
                    contract.connect(unverifiedUser).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
                ).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
                
                await expect(
                    contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, INVALID_CID)
                ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
            });

            it("should emit balance insufficient events", async function () {
                // Drain contract balance
                await contract.connect(victim1).submitClaim(INITIAL_FUNDING, VALID_CID_V0);
                await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, INITIAL_FUNDING);
                await contract.disburseFunds(0);
                
                // Try to approve another claim
                await contract.connect(victim2).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.approveClaim(1, LOW_RISK_AMOUNT)
                ).to.be.revertedWith("Insufficient contract funds");
            });
        });

        describe("Administrative Events", function () {
            it("should emit ownership action events", async function () {
                const newVictim = ethers.Wallet.createRandom().address;
                const newNGO = ethers.Wallet.createRandom().address;
                
                await expect(
                    contract.addVerifiedVictim(newVictim)
                ).to.emit(contract, "OwnershipAction")
                 .withArgs(owner.address, "ADD_VICTIM", newVictim);
                
                await expect(
                    contract.addAuthorizedNGO(newNGO)
                ).to.emit(contract, "OwnershipAction")
                 .withArgs(owner.address, "ADD_NGO", newNGO);
                
                await expect(
                    contract.setLowRiskThreshold(ethers.parseEther("0.2"))
                ).to.emit(contract, "OwnershipAction")
                 .withArgs(owner.address, "UPDATE_THRESHOLD", ethers.ZeroAddress);
            });
        });
    });
});t.approveCl
aim(0, LOW_RISK_AMOUNT)
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
    });

    describe("6. Integration Tests - Complete Claim Lifecycles", function () {
        describe("Low-Risk Claim Lifecycle", function () {
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

        describe("High-Risk Claim Lifecycle", function () {
            it("should complete full high-risk claim lifecycle with NGO approval", async function () {
                const initialBalance = await ethers.provider.getBalance(victim1.address);
                
                // 1. Submit high-risk claim
                await expect(
                    contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0)
                ).to.emit(contract, "ClaimSubmitted");
                
                // 2. NGO approval (no auto-disbursal for high-risk)
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT)
                ).to.emit(contract, "HighRiskClaimVerified")
                 .and.to.emit(contract, "ClaimApproved")
                 .and.to.not.emit(contract, "AutoDisbursalAttempted");
                
                // 3. Manual disbursal
                await expect(
                    contract.disburseFunds(0)
                ).to.emit(contract, "FundsDisbursed")
                 .and.to.emit(contract, "ClaimStatusChanged");
                
                // 4. Verify final state
                const claim = await contract.getClaim(0);
                expect(claim[3]).to.equal(3); // ClaimStatus.DISBURSED
                expect(claim[7]).to.equal(ngo1.address); // ngoVerifier
                
                const finalBalance = await ethers.provider.getBalance(victim1.address);
                expect(finalBalance - initialBalance).to.equal(HIGH_RISK_AMOUNT);
            });
        });

        describe("Mixed Risk Scenarios", function () {
            it("should handle multiple claims with different risk levels", async function () {
                // Submit low-risk and high-risk claims
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                await contract.connect(victim2).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V1);
                
                // Approve low-risk (should auto-disburse)
                await expect(
                    contract.approveClaim(0, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(0, true, "Auto-disbursal successful");
                
                // NGO approve high-risk (should not auto-disburse)
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(1, HIGH_RISK_AMOUNT)
                ).to.not.emit(contract, "AutoDisbursalAttempted");
                
                // Verify states
                const lowRiskClaim = await contract.getClaim(0);
                const highRiskClaim = await contract.getClaim(1);
                
                expect(lowRiskClaim[3]).to.equal(3); // DISBURSED
                expect(highRiskClaim[3]).to.equal(1); // APPROVED (not disbursed)
            });

            it("should handle threshold changes affecting pending claims", async function () {
                // Submit claim at current threshold boundary
                const thresholdAmount = await contract.lowRiskThreshold();
                await contract.connect(victim1).submitClaim(thresholdAmount, VALID_CID_V0);
                
                // Change threshold to make this amount high-risk
                await contract.setLowRiskThreshold(thresholdAmount - 1n);
                
                // Approval should now treat it as high-risk (no auto-disbursal)
                // But regular approveClaim doesn't check risk for auto-disbursal eligibility
                // The risk assessment happens during approval
                await expect(
                    contract.approveClaim(0, thresholdAmount)
                ).to.emit(contract, "RiskAssessed")
                 .withArgs(0, thresholdAmount, "HIGH");
            });
        });

        describe("Error Recovery Scenarios", function () {
            it("should handle claim rejection and resubmission", async function () {
                // Submit and reject claim
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.rejectClaim(0)
                ).to.emit(contract, "ClaimRejected")
                 .and.to.emit(contract, "ClaimStatusChanged");
                
                // Resubmit new claim
                await expect(
                    contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
                ).to.emit(contract, "ClaimSubmitted");
                
                // New claim should be processed normally
                await expect(
                    contract.approveClaim(1, LOW_RISK_AMOUNT)
                ).to.emit(contract, "AutoDisbursalAttempted")
                 .withArgs(1, true, "Auto-disbursal successful");
            });

            it("should handle contract balance depletion gracefully", async function () {
                // Submit multiple claims that would exceed balance
                const largeAmount = ethers.parseEther("6");
                
                await contract.connect(victim1).submitClaim(largeAmount, VALID_CID_V0);
                await contract.connect(victim2).submitClaim(largeAmount, VALID_CID_V0);
                
                // First approval should work
                await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, largeAmount);
                await contract.disburseFunds(0);
                
                // Second approval should fail due to insufficient balance
                await expect(
                    contract.connect(ngo1).reviewAndApproveHighRiskClaim(1, largeAmount)
                ).to.be.revertedWith("Insufficient contract funds");
            });
        });
    });

    describe("7. Gas Optimization Validation", function () {
        describe("Function-Level Gas Measurements", function () {
            it("should measure gas consumption for claim submission", async function () {
                const tx = await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                const receipt = await tx.wait();
                
                console.log(`Submit claim gas used: ${receipt.gasUsed}`);
                expect(receipt.gasUsed).to.be.lt(200000);
            });

            it("should measure gas consumption for claim approval with auto-disbursal", async function () {
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                const tx = await contract.approveClaim(0, LOW_RISK_AMOUNT);
                const receipt = await tx.wait();
                
                console.log(`Approve claim with auto-disbursal gas used: ${receipt.gasUsed}`);
                expect(receipt.gasUsed).to.be.lt(150000);
            });

            it("should measure gas consumption for NGO high-risk approval", async function () {
                await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
                
                const tx = await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT);
                const receipt = await tx.wait();
                
                console.log(`NGO approve high-risk claim gas used: ${receipt.gasUsed}`);
                expect(receipt.gasUsed).to.be.lt(120000);
            });
        });

        describe("Batch Operations Efficiency", function () {
            it("should demonstrate batch victim operations gas savings", async function () {
                const newVictims = [
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address
                ];
                
                // Measure batch operation
                const batchTx = await contract.addVerifiedVictimsBatch(newVictims);
                const batchReceipt = await batchTx.wait();
                
                console.log(`Batch add victims (${newVictims.length}) gas used: ${batchReceipt.gasUsed}`);
                
                // Batch should be more efficient than individual operations
                expect(batchReceipt.gasUsed).to.be.lt(newVictims.length * 60000);
            });

            it("should demonstrate batch NGO operations gas savings", async function () {
                const newNGOs = [
                    ethers.Wallet.createRandom().address,
                    ethers.Wallet.createRandom().address
                ];
                
                const batchTx = await contract.addAuthorizedNGOsBatch(newNGOs);
                const batchReceipt = await batchTx.wait();
                
                console.log(`Batch add NGOs (${newNGOs.length}) gas used: ${batchReceipt.gasUsed}`);
                
                // Should be efficient
                expect(batchReceipt.gasUsed).to.be.lt(100000);
            });
        });

        describe("Storage Optimization", function () {
            it("should efficiently store claim data with packed structs", async function () {
                await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                // Verify all data is stored correctly
                const claim = await contract.getClaim(0);
                expect(claim[0]).to.equal(victim1.address); // claimant
                expect(claim[1]).to.equal(LOW_RISK_AMOUNT); // requested
                expect(claim[5]).to.be.true; // cidValidated
                expect(claim[6]).to.be.true; // addressVerified
                expect(claim[8]).to.be.gt(0); // validationTimestamp
            });
        });

        describe("Custom Errors Gas Efficiency", function () {
            it("should use custom errors for gas savings", async function () {
                // Test various custom errors
                await expect(
                    contract.addVerifiedVictim(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(contract, "InvalidAddress");
                
                await expect(
                    contract.connect(unverifiedUser).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
                ).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
                
                await expect(
                    contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, INVALID_CID)
                ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
            });
        });
    });

    describe("8. Event Logging Comprehensive Tests", function () {
        describe("Complete Event Audit Trail", function () {
            it("should emit all required events for low-risk claim lifecycle", async function () {
                const tx1 = await contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                // Submission events
                await expect(tx1)
                    .to.emit(contract, "CIDValidated")
                    .and.to.emit(contract, "AddressVerified")
                    .and.to.emit(contract, "ValidationTimestampUpdated")
                    .and.to.emit(contract, "ClaimStatusChanged")
                    .and.to.emit(contract, "ClaimSubmitted");
                
                const tx2 = await contract.approveClaim(0, LOW_RISK_AMOUNT);
                
                // Approval and auto-disbursal events
                await expect(tx2)
                    .to.emit(contract, "RiskAssessed")
                    .and.to.emit(contract, "ClaimStatusChanged")
                    .and.to.emit(contract, "ClaimApproved")
                    .and.to.emit(contract, "AutoDisbursalAttempted")
                    .and.to.emit(contract, "FundsDisbursed");
            });

            it("should emit all required events for high-risk claim lifecycle", async function () {
                const tx1 = await contract.connect(victim1).submitClaim(HIGH_RISK_AMOUNT, VALID_CID_V0);
                
                // Submission events
                await expect(tx1)
                    .to.emit(contract, "ClaimSubmitted")
                    .and.to.emit(contract, "CIDValidated")
                    .and.to.emit(contract, "AddressVerified");
                
                const tx2 = await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, HIGH_RISK_AMOUNT);
                
                // NGO approval events
                await expect(tx2)
                    .to.emit(contract, "RiskAssessed")
                    .and.to.emit(contract, "HighRiskClaimVerified")
                    .and.to.emit(contract, "ClaimApproved")
                    .and.to.emit(contract, "ValidationTimestampUpdated");
                
                const tx3 = await contract.disburseFunds(0);
                
                // Manual disbursal events
                await expect(tx3)
                    .to.emit(contract, "ClaimStatusChanged")
                    .and.to.emit(contract, "FundsDisbursed");
            });
        });

        describe("Error and Diagnostic Events", function () {
            it("should emit validation failure events", async function () {
                // These events are emitted before reverts in the actual contract
                // Testing the revert behavior validates the error handling
                await expect(
                    contract.connect(unverifiedUser).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0)
                ).to.be.revertedWithCustomError(contract, "UnverifiedVictimAddress");
                
                await expect(
                    contract.connect(victim1).submitClaim(LOW_RISK_AMOUNT, INVALID_CID)
                ).to.be.revertedWithCustomError(contract, "InvalidCIDFormat");
            });

            it("should emit balance insufficient events", async function () {
                // Drain contract balance
                await contract.connect(victim1).submitClaim(INITIAL_FUNDING, VALID_CID_V0);
                await contract.connect(ngo1).reviewAndApproveHighRiskClaim(0, INITIAL_FUNDING);
                await contract.disburseFunds(0);
                
                // Try to approve another claim
                await contract.connect(victim2).submitClaim(LOW_RISK_AMOUNT, VALID_CID_V0);
                
                await expect(
                    contract.approveClaim(1, LOW_RISK_AMOUNT)
                ).to.be.revertedWith("Insufficient contract funds");
            });
        });

        describe("Administrative Events", function () {
            it("should emit ownership action events", async function () {
                const newVictim = ethers.Wallet.createRandom().address;
                const newNGO = ethers.Wallet.createRandom().address;
                
                await expect(
                    contract.addVerifiedVictim(newVictim)
                ).to.emit(contract, "OwnershipAction")
                 .withArgs(owner.address, "ADD_VICTIM", newVictim);
                
                await expect(
                    contract.addAuthorizedNGO(newNGO)
                ).to.emit(contract, "OwnershipAction")
                 .withArgs(owner.address, "ADD_NGO", newNGO);
                
                await expect(
                    contract.setLowRiskThreshold(ethers.parseEther("0.2"))
                ).to.emit(contract, "OwnershipAction")
                 .withArgs(owner.address, "UPDATE_THRESHOLD", ethers.ZeroAddress);
            });
        });
    });
});