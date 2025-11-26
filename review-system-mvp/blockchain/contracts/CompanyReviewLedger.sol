// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CompanyReviewLedger
 * @dev Simplified blockchain-based company review system
 * Stores only review hash and single universal rating for immutability
 */
contract CompanyReviewLedger {
    address public owner;

    struct Review {
        string companyId;        // Keccak256 hash of company name
        string reviewerHash;     // Keccak256 hash of reviewer email
        string reviewHash;       // Keccak256 hash of full review content
        uint8 rating;            // Universal rating 1-5
        string employmentProof;  // Keccak256 hash of employee ID
        uint256 timestamp;       // Block timestamp
    }

    mapping(string => Review) public reviews;
    string[] public reviewIds;

    event ReviewStored(
        string indexed reviewId,
        string indexed companyId,
        string reviewerHash,
        string reviewHash,
        uint8 rating,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier validRating(uint8 _rating) {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Store a new review on the blockchain
     * @param _reviewId Unique review identifier
     * @param _companyId Hashed company identifier
     * @param _reviewerHash Hashed reviewer identifier
     * @param _reviewHash Hash of the complete review content
     * @param _rating Universal rating (1-5)
     * @param _employmentProof Hashed employment proof
     */
    function storeReview(
        string memory _reviewId,
        string memory _companyId,
        string memory _reviewerHash,
        string memory _reviewHash,
        uint8 _rating,
        string memory _employmentProof
    ) public onlyOwner validRating(_rating) {
        require(!reviewExists(_reviewId), "Review ID already exists");
        require(bytes(_reviewId).length > 0, "Review ID cannot be empty");
        require(bytes(_companyId).length > 0, "Company ID cannot be empty");
        require(bytes(_reviewHash).length > 0, "Review hash cannot be empty");

        Review memory newReview = Review({
            companyId: _companyId,
            reviewerHash: _reviewerHash,
            reviewHash: _reviewHash,
            rating: _rating,
            employmentProof: _employmentProof,
            timestamp: block.timestamp
        });

        reviews[_reviewId] = newReview;
        reviewIds.push(_reviewId);

        emit ReviewStored(
            _reviewId,
            _companyId,
            _reviewerHash,
            _reviewHash,
            _rating,
            block.timestamp
        );
    }

    /**
     * @dev Check if a review exists
     * @param _reviewId Review identifier to check
     * @return bool True if review exists
     */
    function reviewExists(string memory _reviewId) public view returns (bool) {
        return reviews[_reviewId].timestamp > 0;
    }

    /**
     * @dev Get a specific review by ID
     * @param _reviewId Review identifier
     * @return Review struct
     */
    function getReview(string memory _reviewId) public view returns (Review memory) {
        require(reviewExists(_reviewId), "Review does not exist");
        return reviews[_reviewId];
    }

    /**
     * @dev Get all reviews for a specific company
     * @param _companyId Hashed company identifier
     * @return Array of matching review IDs
     */
    function getReviewsByCompanyId(string memory _companyId) public view returns (string[] memory) {
        uint256 count = 0;

        // First pass: count matching reviews
        for (uint256 i = 0; i < reviewIds.length; i++) {
            if (keccak256(bytes(reviews[reviewIds[i]].companyId)) == keccak256(bytes(_companyId))) {
                count++;
            }
        }

        // Second pass: populate result array
        string[] memory result = new string[](count);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            if (keccak256(bytes(reviews[reviewIds[i]].companyId)) == keccak256(bytes(_companyId))) {
                result[resultIndex] = reviewIds[i];
                resultIndex++;
            }
        }

        return result;
    }

    /**
     * @dev Get all review IDs
     * @return Array of all review IDs
     */
    function getAllReviewIds() public view returns (string[] memory) {
        return reviewIds;
    }

    /**
     * @dev Get total number of reviews
     * @return Total count
     */
    function getReviewCount() public view returns (uint256) {
        return reviewIds.length;
    }

    /**
     * @dev Get review timestamp
     * @param _reviewId Review identifier
     * @return Timestamp of review creation
     */
    function getTimestamp(string memory _reviewId) public view returns (uint256) {
        require(reviewExists(_reviewId), "Review does not exist");
        return reviews[_reviewId].timestamp;
    }

    /**
     * @dev Verify if a review hash matches the stored hash
     * @param _reviewId Review identifier
     * @param _reviewHash Hash to verify
     * @return bool True if hashes match
     */
    function verifyReviewHash(string memory _reviewId, string memory _reviewHash) public view returns (bool) {
        require(reviewExists(_reviewId), "Review does not exist");
        return keccak256(bytes(reviews[_reviewId].reviewHash)) == keccak256(bytes(_reviewHash));
    }
}
