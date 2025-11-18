// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Company Review Ledger
/// @notice Store company reviews from employees on blockchain
contract CompanyReviewLedger {
    address public owner;

    struct Review {
        string companyId;        // Hash of company name
        string reviewerHash;     // Hash of employee email
        uint8 workLifeBalance;   // Rating 1-5
        uint8 salary;            // Rating 1-5
        uint8 management;        // Rating 1-5
        string reviewText;       // Review comment
        string employmentProof;  // Hash of employee ID as proof
        uint256 timestamp;       // When review was created
    }

    // Mapping from review ID to Review
    mapping(string => Review) public reviews;
    
    // Array to store all review IDs
    string[] public reviewIds;
    
    // Counter for total reviews
    uint256 public totalReviews;

    event ReviewStored(
        string reviewId,
        string companyId,
        string reviewerHash,
        uint8 workLifeBalance,
        uint8 salary,
        uint8 management,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can write");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalReviews = 0;
    }

    /// @notice Store a new company review
    /// @param reviewId Unique review ID
    /// @param companyId Hash of company name
    /// @param reviewerHash Hash of employee email
    /// @param workLifeBalance Rating 1-5
    /// @param salary Rating 1-5
    /// @param management Rating 1-5
    /// @param reviewText Review comment
    /// @param employmentProof Hash of employee ID
    function storeReview(
        string memory reviewId,
        string memory companyId,
        string memory reviewerHash,
        uint8 workLifeBalance,
        uint8 salary,
        uint8 management,
        string memory reviewText,
        string memory employmentProof
    ) public onlyOwner {
        require(bytes(reviews[reviewId].companyId).length == 0, "Review ID already exists");
        require(workLifeBalance >= 1 && workLifeBalance <= 5, "Work-life balance rating must be 1-5");
        require(salary >= 1 && salary <= 5, "Salary rating must be 1-5");
        require(management >= 1 && management <= 5, "Management rating must be 1-5");

        reviews[reviewId] = Review(
            companyId,
            reviewerHash,
            workLifeBalance,
            salary,
            management,
            reviewText,
            employmentProof,
            block.timestamp
        );
        
        // Add review ID to the array
        reviewIds.push(reviewId);
        totalReviews++;

        emit ReviewStored(
            reviewId,
            companyId,
            reviewerHash,
            workLifeBalance,
            salary,
            management,
            block.timestamp
        );
    }

    /// @notice Get review details
    /// @param reviewId The review ID to query
    /// @return Review struct
    function getReview(string memory reviewId) public view returns (Review memory) {
        require(bytes(reviews[reviewId].companyId).length > 0, "Review not found");
        return reviews[reviewId];
    }

    /// @notice Verify if a review exists
    /// @param reviewId The review ID to check
    /// @return exists True if review exists
    function reviewExists(string memory reviewId) public view returns (bool exists) {
        return bytes(reviews[reviewId].companyId).length > 0;
    }

    /// @notice Get all reviews for a specific company
    /// @param companyId The company ID to query
    /// @return Array of Review structs for the company
    function getReviewsByCompanyId(string memory companyId) public view returns (Review[] memory) {
        // First pass: count matching reviews
        uint256 count = 0;
        for (uint256 i = 0; i < reviewIds.length; i++) {
            if (keccak256(bytes(reviews[reviewIds[i]].companyId)) == keccak256(bytes(companyId))) {
                count++;
            }
        }

        // Create array with exact size needed
        Review[] memory companyReviews = new Review[](count);
        
        // Second pass: populate the array
        uint256 index = 0;
        for (uint256 i = 0; i < reviewIds.length; i++) {
            if (keccak256(bytes(reviews[reviewIds[i]].companyId)) == keccak256(bytes(companyId))) {
                companyReviews[index] = reviews[reviewIds[i]];
                index++;
            }
        }

        return companyReviews;
    }

    /// @notice Get timestamp of a review
    /// @param reviewId The review ID
    /// @return timestamp When the review was created
    function getTimestamp(string memory reviewId) public view returns (uint256) {
        return reviews[reviewId].timestamp;
    }
    
    /// @notice Get all review IDs
    /// @return Array of all review IDs
    function getAllReviewIds() public view returns (string[] memory) {
        return reviewIds;
    }
}