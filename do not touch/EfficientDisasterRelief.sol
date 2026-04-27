// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EfficientDisasterRelief is ERC721URIStorage, Ownable, ReentrancyGuard {
    enum ClaimStatus { PENDING, APPROVED, REJECTED, DISBURSED }

    struct Claim {
        address claimant;
        uint256 requested;
        uint256 approved;
        ClaimStatus status;
        string docsIpfs;
    }

    uint256 public constant MIN_DONATION_FOR_NFT = 1 ether;
    uint256 public nextTokenId;
    uint256 public nextClaimId;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public userClaims;

    event Donation(address indexed donor, uint256 amount, uint256 indexed tokenId);
    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant);
    event ClaimApproved(uint256 indexed claimId, uint256 amount);
    event ClaimRejected(uint256 indexed claimId);
    event FundsDisbursed(uint256 indexed claimId, address indexed to, uint256 amount);

    constructor(address initialOwner)
        ERC721("Relief Donor", "RDN")
        Ownable(initialOwner)
    {}

    function donate(string memory ipfsMetadata) external payable {
        require(msg.value > 0, "Donation cannot be zero");

        if (msg.value >= MIN_DONATION_FOR_NFT) {
            uint256 tokenId = nextTokenId++;
            _mint(msg.sender, tokenId);
            _setTokenURI(tokenId, ipfsMetadata);
            emit Donation(msg.sender, msg.value, tokenId);
        } else {
            emit Donation(msg.sender, msg.value, 0);
        }
    }

    function submitClaim(uint256 requested, string memory docsIpfs) external {
        require(requested > 0, "Requested amount must be greater than zero");
        uint256 claimId = nextClaimId++;
        claims[claimId] = Claim(msg.sender, requested, 0, ClaimStatus.PENDING, docsIpfs);
        userClaims[msg.sender].push(claimId);
        emit ClaimSubmitted(claimId, msg.sender);
    }

    function approveClaim(uint256 claimId, uint256 approved) external onlyOwner nonReentrant {
        Claim storage c = claims[claimId];
        require(c.status == ClaimStatus.PENDING, "Claim is not in a pending state");
        require(approved <= c.requested, "Approved amount cannot exceed requested amount");
        require(address(this).balance >= approved, "Insufficient funds in contract for this approval");
        
        c.status = ClaimStatus.APPROVED;
        c.approved = approved;
        emit ClaimApproved(claimId, approved);
    }

    function rejectClaim(uint256 claimId) external onlyOwner {
        Claim storage c = claims[claimId];
        require(c.status == ClaimStatus.PENDING, "Claim is not in a pending state");
        c.status = ClaimStatus.REJECTED;
        emit ClaimRejected(claimId);
    }

    function disburseFunds(uint256 claimId) external onlyOwner nonReentrant {
        Claim storage c = claims[claimId];
        require(c.status == ClaimStatus.APPROVED, "Claim has not been approved for disbursement");
        require(address(this).balance >= c.approved, "Insufficient funds to disburse");
        
        c.status = ClaimStatus.DISBURSED;
        (bool ok, ) = payable(c.claimant).call{value: c.approved}("");
        require(ok, "Transfer of funds failed");
        
        emit FundsDisbursed(claimId, c.claimant, c.approved);
    }

    function getClaimIds(address user) external view returns(uint256[] memory) {
        return userClaims[user];
    }

    function getClaim(uint256 id) external view returns(address, uint256, uint256, ClaimStatus, string memory) {
        Claim memory c = claims[id];
        return (c.claimant, c.requested, c.approved, c.status, c.docsIpfs);
    }

    function contractBalance() external view returns(uint256) {
        return address(this).balance;
    }
}
