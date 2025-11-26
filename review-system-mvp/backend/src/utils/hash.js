const crypto = require('crypto');
const { Web3 } = require('web3');

const web3 = new Web3();

/**
 * Generate Keccak256 hash (Ethereum standard)
 * @param {string} data - Data to hash
 * @returns {string} Hex hash with 0x prefix
 */
function keccak256(data) {
    return web3.utils.keccak256(data);
}

/**
 * Generate SHA256 hash
 * @param {string} data - Data to hash
 * @returns {string} Hex hash
 */
function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate unique review ID
 * @returns {string} Format: REV + timestamp + random
 */
function generateReviewId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `REV${timestamp}${random}`.toUpperCase();
}

/**
 * Hash email for privacy
 * @param {string} email - Email address
 * @returns {string} Keccak256 hash
 */
function hashEmail(email) {
    return keccak256(email.toLowerCase().trim());
}

/**
 * Hash company name for blockchain ID
 * @param {string} companyName - Company name
 * @returns {string} Keccak256 hash
 */
function hashCompanyName(companyName) {
    return keccak256(companyName.trim());
}

/**
 * Hash employee ID for privacy
 * @param {string} employeeId - Employee ID
 * @returns {string} Keccak256 hash
 */
function hashEmployeeId(employeeId) {
    return keccak256(employeeId.trim());
}

/**
 * Hash review content
 * @param {object} reviewData - Review data object
 * @returns {string} Keccak256 hash
 */
function hashReviewContent(reviewData) {
    const content = JSON.stringify({
        companyId: reviewData.companyId,
        rating: reviewData.rating,
        reviewText: reviewData.reviewText,
        timestamp: reviewData.timestamp
    });
    return keccak256(content);
}

module.exports = {
    keccak256,
    sha256,
    generateReviewId,
    hashEmail,
    hashCompanyName,
    hashEmployeeId,
    hashReviewContent
};
