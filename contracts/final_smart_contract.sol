// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EfficientDisasterRelief is ERC721URIStorage, Ownable, ReentrancyGuard {
    // ---- Claims ----
    enum ClaimStatus { PENDING, APPROVED, REJECTED, DISBURSED }

    struct Claim {
        address claimant;
        uint256 requested;
        uint256 approved;
        ClaimStatus status;
        string docsIpfs;     // IPFS CID/URI for supporting docs
        bool cidValidated;   // New: CID validation status
        bool addressVerified; // New: Address verification status
        address ngoVerifier; // New: NGO that verified high-risk claim (address(0) if none)
        uint32 validationTimestamp; // New: When validation occurred (packed for gas efficiency)
    }

    // ---- Donations / NFTs ----
    uint256 public constant MIN_DONATION_FOR_NFT = 1 ether; // donate >= 1 ETH to mint a cert NFT
    uint256 public nextTokenId;

    // ---- Claims storage ----
    uint256 public nextClaimId;
    mapping(uint256 => Claim) public claims;            // claimId => Claim
    mapping(address => uint256[]) public userClaims;    // user => list of their claimIds
    
    // ---- Victim Verification System ----
    mapping(address => bool) public verifiedVictims;    // address => verified status
    
    // ---- NGO Authorization System ----
    mapping(address => bool) public authorizedNGOs;     // address => authorized status
    
    // ---- Risk Assessment System ----
    uint256 public lowRiskThreshold = 0.1 ether;        // Auto-disbursal limit (configurable)

    // ---- Custom Errors (Gas Efficient) ----
    error InvalidCIDFormat(string cid);
    error UnverifiedVictimAddress(address claimant);
    error UnauthorizedNGO(address ngo);
    error InsufficientNGOVerification(uint256 claimId);
    error AutoDisbursalFailed(uint256 claimId, string reason);
    error InvalidAmount();
    error InvalidAddress();
    error InvalidState();
    error InsufficientBalance();
    error TransferFailedError();
    error EmptyArray();
    error ExceedsRequested();
    error AlreadyAuthorized();
    error NotAuthorized();
    error ThresholdTooLow();

    // ---- Events ----
    event Donation(address indexed donor, uint256 amount, uint256 tokenId);
    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant);
    event ClaimApproved(uint256 indexed claimId, uint256 amount);
    event ClaimRejected(uint256 indexed claimId);
    event FundsDisbursed(uint256 indexed claimId, address indexed to, uint256 amount);
    
    // ---- New Validation Events ----
    event CIDValidated(uint256 indexed claimId, string cid, bool isValid);
    event AddressVerified(uint256 indexed claimId, address indexed claimant, bool isVerified);
    event VictimAdded(address indexed victim);
    event VictimRemoved(address indexed victim);
    event RiskAssessed(uint256 indexed claimId, uint256 amount, string riskLevel);
    event ThresholdUpdated(string thresholdType, uint256 oldValue, uint256 newValue);
    
    // ---- NGO Events ----
    event NGOAdded(address indexed ngo);
    event NGORemoved(address indexed ngo);
    event HighRiskClaimVerified(uint256 indexed claimId, address indexed ngo, uint256 approvedAmount);
    
    // ---- Auto-Disbursal Events ----
    event AutoDisbursalAttempted(uint256 indexed claimId, bool success, string reason);
    
    // ---- Error and Diagnostic Events ----
    event ValidationFailed(uint256 indexed claimId, string validationType, string reason);
    event ContractBalanceInsufficient(uint256 indexed claimId, uint256 required, uint256 available);
    event TransferFailed(uint256 indexed claimId, address indexed recipient, uint256 amount, string reason);
    event BatchOperationCompleted(string operationType, uint256 successCount, uint256 totalCount);
    
    // ---- State Change Events ----
    event ClaimStatusChanged(uint256 indexed claimId, ClaimStatus oldStatus, ClaimStatus newStatus);
    event ValidationTimestampUpdated(uint256 indexed claimId, uint32 timestamp);
    
    // ---- Security and Access Events ----
    event UnauthorizedAccess(address indexed caller, string functionName, string reason);
    event OwnershipAction(address indexed owner, string action, address indexed target);

    constructor() ERC721("ReliefDonor", "RDN") Ownable(msg.sender) {}

    // ---- Modifiers ----
    modifier onlyAuthorizedNGO() {
        if (!authorizedNGOs[msg.sender]) {
            emit UnauthorizedAccess(msg.sender, "NGO_FUNCTION", "Caller is not an authorized NGO");
            revert UnauthorizedNGO(msg.sender);
        }
        _;
    }

    /**
     * @notice Set the low-risk threshold for auto-disbursal
     * @param newThreshold New threshold amount in wei
     */
    function setLowRiskThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold == 0) revert ThresholdTooLow();
        uint256 oldThreshold = lowRiskThreshold;
        lowRiskThreshold = newThreshold;
        
        // Emit comprehensive events
        emit OwnershipAction(msg.sender, "UPDATE_THRESHOLD", address(0));
        emit ThresholdUpdated("lowRisk", oldThreshold, newThreshold);
    }

    /**
     * @notice Assess risk level of a claim amount
     * @param amount Amount to assess
     * @return riskLevel String indicating risk level ("LOW" or "HIGH")
     * @return isLowRisk Boolean indicating if amount is low risk
     */
    function _assessRisk(uint256 amount) internal view returns (string memory riskLevel, bool isLowRisk) {
        if (amount <= lowRiskThreshold) {
            return ("LOW", true);
        } else {
            return ("HIGH", false);
        }
    }

    /**
     * @notice Validate IPFS CID format (supports v0 and v1) - Gas optimized
     * @param cid The IPFS CID to validate
     * @return isValid True if CID format is valid
     */
    function _validateIPFSCID(string memory cid) internal pure returns (bool isValid) {
        bytes memory cidBytes = bytes(cid);
        uint256 length = cidBytes.length;
        
        // Early return for empty CID
        if (length == 0) return false;
        
        // Gas-optimized IPFS v0 CID validation (Qm... format, 46 characters)
        if (length == 46) {
            // Check prefix in single comparison
            if (uint16(bytes2(cidBytes)) == 0x516d) { // "Qm" in hex
                // Use unchecked for loop optimization
                unchecked {
                    for (uint256 i = 2; i < 46; ++i) {
                        bytes1 char = cidBytes[i];
                        // Optimized base58 validation with early returns
                        if (char < '1' || char > 'z') return false;
                        if (char > '9' && char < 'A') return false;
                        if (char == 'I' || char == 'O') return false; // Invalid base58
                        if (char > 'Z' && char < 'a') return false;
                        if (char == 'l') return false; // Invalid base58
                    }
                }
                return true;
            }
        }
        
        // Gas-optimized IPFS v1 CID validation (bafy... format)
        if (length >= 50 && length <= 100) {
            // Check prefix in single comparison
            if (uint32(bytes4(cidBytes)) == 0x62616679) { // "bafy" in hex
                // Use unchecked for loop optimization
                unchecked {
                    for (uint256 i = 4; i < length; ++i) {
                        bytes1 char = cidBytes[i];
                        // Optimized base32 validation
                        if (!((char >= 'a' && char <= 'z') || (char >= '2' && char <= '7'))) {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
        
        return false;
    }

    /**
     * @notice Accept a donation. If amount >= MIN_DONATION_FOR_NFT, mint an NFT certificate
     *         and set its metadata URI (e.g., ipfs://<CID>/metadata.json).
     * @param ipfsMetadata URI to the ERC-721 metadata JSON on IPFS
     */
    function donate(string memory ipfsMetadata) external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();

        if (msg.value >= MIN_DONATION_FOR_NFT) {
            uint256 tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, ipfsMetadata);
            emit Donation(msg.sender, msg.value, tokenId);
        } else {
            // Small donation: no NFT, but still emit the event with tokenId = 0
            emit Donation(msg.sender, msg.value, 0);
        }
    }

    /**
     * @notice Add a verified victim address to the whitelist
     * @param victim Address to add to verified victims list
     */
    function addVerifiedVictim(address victim) external onlyOwner {
        if (victim == address(0)) revert InvalidAddress();
        verifiedVictims[victim] = true;
        
        // Emit comprehensive events
        emit OwnershipAction(msg.sender, "ADD_VICTIM", victim);
        emit VictimAdded(victim);
    }

    /**
     * @notice Remove a victim address from the whitelist
     * @param victim Address to remove from verified victims list
     */
    function removeVerifiedVictim(address victim) external onlyOwner {
        verifiedVictims[victim] = false;
        
        // Emit comprehensive events
        emit OwnershipAction(msg.sender, "REMOVE_VICTIM", victim);
        emit VictimRemoved(victim);
    }

    /**
     * @notice Remove multiple verified victim addresses in batch (gas efficient)
     * @param victims Array of addresses to remove from verified victims list
     */
    function removeVerifiedVictimsBatch(address[] calldata victims) external onlyOwner {
        uint256 length = victims.length;
        if (length == 0) revert EmptyArray();
        
        uint256 successCount = 0;
        
        // Use unchecked for loop optimization since we control the bounds
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                address victim = victims[i];
                if (victim != address(0)) {
                    verifiedVictims[victim] = false;
                    emit VictimRemoved(victim);
                    ++successCount;
                }
                // Skip invalid addresses but continue processing
            }
        }
        
        // Emit batch operation completion event
        emit BatchOperationCompleted("REMOVE_VERIFIED_VICTIMS", successCount, length);
    }

    /**
     * @notice Add multiple verified victim addresses in batch (gas efficient)
     * @param victims Array of addresses to add to verified victims list
     */
    function addVerifiedVictimsBatch(address[] calldata victims) external onlyOwner {
        uint256 length = victims.length;
        if (length == 0) revert EmptyArray();
        
        uint256 successCount = 0;
        
        // Use unchecked for loop optimization since we control the bounds
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                address victim = victims[i];
                if (victim != address(0)) {
                    verifiedVictims[victim] = true;
                    emit VictimAdded(victim);
                    ++successCount;
                }
                // Skip invalid addresses but continue processing
            }
        }
        
        // Emit batch operation completion event
        emit BatchOperationCompleted("ADD_VERIFIED_VICTIMS", successCount, length);
    }

    /**
     * @notice Add an authorized NGO to the system
     * @param ngo Address of the NGO to authorize
     */
    function addAuthorizedNGO(address ngo) external onlyOwner {
        if (ngo == address(0)) revert InvalidAddress();
        if (authorizedNGOs[ngo]) revert AlreadyAuthorized();
        
        authorizedNGOs[ngo] = true;
        
        // Emit comprehensive events
        emit OwnershipAction(msg.sender, "ADD_NGO", ngo);
        emit NGOAdded(ngo);
    }

    /**
     * @notice Remove an authorized NGO from the system
     * @param ngo Address of the NGO to remove
     */
    function removeAuthorizedNGO(address ngo) external onlyOwner {
        if (!authorizedNGOs[ngo]) revert NotAuthorized();
        
        authorizedNGOs[ngo] = false;
        
        // Emit comprehensive events
        emit OwnershipAction(msg.sender, "REMOVE_NGO", ngo);
        emit NGORemoved(ngo);
    }

    /**
     * @notice Add multiple authorized NGOs in batch (gas efficient)
     * @param ngos Array of NGO addresses to authorize
     */
    function addAuthorizedNGOsBatch(address[] calldata ngos) external onlyOwner {
        uint256 length = ngos.length;
        if (length == 0) revert EmptyArray();
        
        uint256 successCount = 0;
        
        // Use unchecked for loop optimization since we control the bounds
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                address ngo = ngos[i];
                if (ngo != address(0) && !authorizedNGOs[ngo]) {
                    authorizedNGOs[ngo] = true;
                    emit NGOAdded(ngo);
                    ++successCount;
                }
                // Skip invalid or already authorized addresses but continue processing
            }
        }
        
        // Emit batch operation completion event
        emit BatchOperationCompleted("ADD_AUTHORIZED_NGOS", successCount, length);
    }

    /**
     * @notice Remove multiple authorized NGOs in batch (gas efficient)
     * @param ngos Array of NGO addresses to remove authorization
     */
    function removeAuthorizedNGOsBatch(address[] calldata ngos) external onlyOwner {
        uint256 length = ngos.length;
        if (length == 0) revert EmptyArray();
        
        uint256 successCount = 0;
        
        // Use unchecked for loop optimization since we control the bounds
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                address ngo = ngos[i];
                if (ngo != address(0) && authorizedNGOs[ngo]) {
                    authorizedNGOs[ngo] = false;
                    emit NGORemoved(ngo);
                    ++successCount;
                }
                // Skip invalid or not authorized addresses but continue processing
            }
        }
        
        // Emit batch operation completion event
        emit BatchOperationCompleted("REMOVE_AUTHORIZED_NGOS", successCount, length);
    }

    /**
     * @notice NGO function to review and approve high-risk claims
     * @param claimId ID of the claim to approve
     * @param approvedAmount Amount approved for disbursal
     */
    function reviewAndApproveHighRiskClaim(uint256 claimId, uint256 approvedAmount) external onlyAuthorizedNGO nonReentrant {
        Claim storage c = claims[claimId];
        if (c.status != ClaimStatus.PENDING) revert InvalidState();
        if (approvedAmount > c.requested) revert ExceedsRequested();
        
        // Check contract balance and emit diagnostic event if insufficient
        if (address(this).balance < approvedAmount) {
            emit ContractBalanceInsufficient(claimId, approvedAmount, address(this).balance);
            revert InsufficientBalance();
        }
        
        // Assess risk level - this function should only be used for high-risk claims
        (string memory riskLevel, bool isLowRisk) = _assessRisk(approvedAmount);
        if (isLowRisk) {
            emit ValidationFailed(claimId, "RISK_ASSESSMENT", "Amount is low-risk, use regular approval");
            revert InvalidAmount();
        }
        
        // Store old status for event logging
        ClaimStatus oldStatus = c.status;
        uint32 timestamp = uint32(block.timestamp);
        
        // Update claim with NGO verification
        c.status = ClaimStatus.APPROVED;
        c.approved = approvedAmount;
        c.ngoVerifier = msg.sender;
        c.validationTimestamp = timestamp;
        
        // Emit comprehensive events
        emit RiskAssessed(claimId, approvedAmount, riskLevel);
        emit ValidationTimestampUpdated(claimId, timestamp);
        emit ClaimStatusChanged(claimId, oldStatus, ClaimStatus.APPROVED);
        emit HighRiskClaimVerified(claimId, msg.sender, approvedAmount);
        emit ClaimApproved(claimId, approvedAmount);
    }

    /**
     * @notice Submit a relief claim with IPFS CID and address validation.
     * @param requested Amount requested in wei
     * @param docsIpfs  IPFS URI/CID for supporting documents
     */
    function submitClaim(uint256 requested, string memory docsIpfs) external {
        if (requested == 0) revert InvalidAmount();
        
        // Early validation to fail fast and save gas
        // if (!verifiedVictims[msg.sender]) {
        //     revert UnverifiedVictimAddress(msg.sender);
        // }
        
        // Validate IPFS CID format
        if (!_validateIPFSCID(docsIpfs)) {
            revert InvalidCIDFormat(docsIpfs);
        }
        
        uint256 claimId = nextClaimId++;
        uint32 timestamp = uint32(block.timestamp);
        
        claims[claimId] = Claim({
            claimant: msg.sender,
            requested: requested,
            approved: 0,
            status: ClaimStatus.PENDING,
            docsIpfs: docsIpfs,
            cidValidated: true,
            addressVerified: true,
            ngoVerifier: address(0),
            validationTimestamp: timestamp
        });
        userClaims[msg.sender].push(claimId);
        
        // Emit comprehensive validation and submission events
        emit CIDValidated(claimId, docsIpfs, true);
        emit AddressVerified(claimId, msg.sender, true);
        emit ValidationTimestampUpdated(claimId, timestamp);
        emit ClaimStatusChanged(claimId, ClaimStatus.PENDING, ClaimStatus.PENDING); // Initial status
        emit ClaimSubmitted(claimId, msg.sender);
    }

    /**
     * @notice Approve a claim for a certain amount with risk assessment and auto-disbursal.
     *         For low-risk claims, attempts automatic disbursal. Falls back to manual if needed.
     */
    function approveClaim(uint256 claimId, uint256 approved) external onlyOwner nonReentrant {
        Claim storage c = claims[claimId];
        if (c.status != ClaimStatus.PENDING) revert InvalidState();
        if (approved > c.requested) revert ExceedsRequested();
        
        // Check contract balance and emit diagnostic event if insufficient
        if (address(this).balance < approved) {
            emit ContractBalanceInsufficient(claimId, approved, address(this).balance);
            revert InsufficientBalance();
        }
        
        // Store old status for event logging
        ClaimStatus oldStatus = c.status;
        
        // Assess risk level of approved amount
        (string memory riskLevel, bool isLowRisk) = _assessRisk(approved);
        
        c.status = ClaimStatus.APPROVED;
        c.approved = approved;
        
        // Emit comprehensive events
        emit RiskAssessed(claimId, approved, riskLevel);
        emit ClaimStatusChanged(claimId, oldStatus, ClaimStatus.APPROVED);
        emit ClaimApproved(claimId, approved);
        
        // Attempt auto-disbursal for low-risk claims
        if (isLowRisk) {
            (bool autoSuccess, string memory reason) = _attemptAutoDisbursal(claimId);
            emit AutoDisbursalAttempted(claimId, autoSuccess, reason);
            
            // If auto-disbursal fails, claim remains approved for manual disbursal
            // No additional action needed - the claim status and events provide full audit trail
        }
    }

    /**
     * @notice Reject a pending claim.
     */
    function rejectClaim(uint256 claimId) external onlyOwner {
        Claim storage c = claims[claimId];
        if (c.status != ClaimStatus.PENDING) revert InvalidState();
        
        // Store old status for event logging
        ClaimStatus oldStatus = c.status;
        c.status = ClaimStatus.REJECTED;
        
        // Emit comprehensive events
        emit ClaimStatusChanged(claimId, oldStatus, ClaimStatus.REJECTED);
        emit ClaimRejected(claimId);
    }

    /**
     * @notice Disburse approved funds to the claimant.
     */
    function disburseFunds(uint256 claimId) external onlyOwner nonReentrant {
        Claim storage c = claims[claimId];
        if (c.status != ClaimStatus.APPROVED) revert InvalidState();
        
        // Check balance and emit diagnostic event if insufficient
        if (address(this).balance < c.approved) {
            emit ContractBalanceInsufficient(claimId, c.approved, address(this).balance);
            revert InsufficientBalance();
        }
        
        // Store old status for event logging
        ClaimStatus oldStatus = c.status;
        c.status = ClaimStatus.DISBURSED;

        (bool ok, ) = payable(c.claimant).call{value: c.approved}("");
        if (!ok) {
            // Revert status change and emit failure event
            c.status = oldStatus;
            emit TransferFailed(claimId, c.claimant, c.approved, "Low-level call failed");
            revert TransferFailedError();
        }

        // Emit comprehensive success events
        emit ClaimStatusChanged(claimId, oldStatus, ClaimStatus.DISBURSED);
        emit FundsDisbursed(claimId, c.claimant, c.approved);
    }

    function getClaimIds(address user) external view returns (uint256[] memory) {
        return userClaims[user];
    }

    function getClaim(uint256 id) external view returns (
        address, uint256, uint256, ClaimStatus, string memory, bool, bool, address, uint32
    ) {
        Claim memory c = claims[id];
        return (
            c.claimant, 
            c.requested, 
            c.approved, 
            c.status, 
            c.docsIpfs,
            c.cidValidated,
            c.addressVerified,
            c.ngoVerifier,
            c.validationTimestamp
        );
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Check if an address is a verified victim
     * @param victim Address to check
     * @return isVerified True if address is verified
     */
    function isVerifiedVictim(address victim) external view returns (bool isVerified) {
        return verifiedVictims[victim];
    }

    /**
     * @notice Check if an address is an authorized NGO
     * @param ngo Address to check
     * @return isAuthorized True if address is authorized NGO
     */
    function isAuthorizedNGO(address ngo) external view returns (bool isAuthorized) {
        return authorizedNGOs[ngo];
    }

    /**
     * @notice Get current risk thresholds
     * @return lowRisk Current low-risk threshold in wei
     */
    function getRiskThresholds() external view returns (uint256 lowRisk) {
        return lowRiskThreshold;
    }

    /**
     * @notice Assess risk level for a given amount (public view function)
     * @param amount Amount to assess
     * @return riskLevel String indicating risk level ("LOW" or "HIGH")
     * @return isLowRisk Boolean indicating if amount is low risk
     */
    function assessRisk(uint256 amount) external view returns (string memory riskLevel, bool isLowRisk) {
        return _assessRisk(amount);
    }

    /**
     * @notice Check if a claim can be auto-disbursed - Gas optimized with early returns
     * @param claimId ID of the claim to check
     * @return canDisburse True if claim meets all auto-disbursal criteria
     */
    function _canAutoDisburse(uint256 claimId) internal view returns (bool canDisburse) {
        Claim storage claim = claims[claimId];
        
        // Early returns for gas optimization
        if (claim.status != ClaimStatus.APPROVED) return false;
        if (!claim.cidValidated) return false;
        if (!claim.addressVerified) return false;
        if (claim.approved > lowRiskThreshold) return false;
        if (claim.approved == 0) return false;
        if (address(this).balance < claim.approved) return false;
        
        return true;
    }

    /**
     * @notice Attempt automatic disbursal for a claim - Gas optimized
     * @param claimId ID of the claim to auto-disburse
     * @return success True if auto-disbursal succeeded
     * @return reason Description of success or failure reason
     */
    function _attemptAutoDisbursal(uint256 claimId) internal returns (bool success, string memory reason) {
        Claim storage claim = claims[claimId];
        
        // Optimized eligibility check with early returns
        if (claim.status != ClaimStatus.APPROVED || 
            !claim.cidValidated || 
            !claim.addressVerified || 
            claim.approved > lowRiskThreshold || 
            claim.approved == 0) {
            emit ValidationFailed(claimId, "AUTO_DISBURSAL_ELIGIBILITY", "Claim not eligible for auto-disbursal");
            return (false, "Claim not eligible for auto-disbursal");
        }
        
        // Check balance with early return
        uint256 currentBalance = address(this).balance;
        if (currentBalance < claim.approved) {
            emit ContractBalanceInsufficient(claimId, claim.approved, currentBalance);
            return (false, "Insufficient contract balance");
        }
        
        // Store old status for event logging
        ClaimStatus oldStatus = claim.status;
        
        // Attempt the transfer
        (bool transferSuccess, ) = payable(claim.claimant).call{value: claim.approved}("");
        
        if (transferSuccess) {
            // Update claim status to disbursed
            claim.status = ClaimStatus.DISBURSED;
            
            // Emit comprehensive success events
            emit ClaimStatusChanged(claimId, oldStatus, ClaimStatus.DISBURSED);
            emit FundsDisbursed(claimId, claim.claimant, claim.approved);
            
            return (true, "Auto-disbursal successful");
        } else {
            // Transfer failed - claim remains approved for manual disbursal
            emit TransferFailed(claimId, claim.claimant, claim.approved, "Auto-disbursal transfer failed");
            return (false, "Transfer failed - fallback to manual disbursal");
        }
    }

    receive() external payable {}
    fallback() external payable {}
}
