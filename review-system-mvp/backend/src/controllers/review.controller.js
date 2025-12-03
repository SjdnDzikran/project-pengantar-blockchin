const pool = require('../config/database');
const blockchainService = require('../config/blockchain');
const { generateReviewId, hashEmail, hashEmployeeId, hashReviewContent } = require('../utils/hash');

/**
 * Submit new review
 * Note: Frontend now handles blockchain transaction, backend only stores metadata
 */
async function submitReview(req, res) {
    const { companyId, rating, reviewText, employeeId, blockchainData, walletAddress } = req.body;

    try {
        // Validate input
        if (!companyId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Company ID and rating are required'
            });
        }

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        if (!blockchainData || !blockchainData.transactionHash || !blockchainData.reviewId) {
            return res.status(400).json({
                success: false,
                message: 'Blockchain transaction data is required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if company exists
        const companyResult = await pool.query(
            'SELECT company_id, company_name FROM companies WHERE company_id = $1',
            [companyId]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const company = companyResult.rows[0];

        // Look up user by wallet address
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
            [walletAddress]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please verify employment first.'
            });
        }

        const userId = userResult.rows[0].user_id;

        // Check employment verification
        const verificationResult = await pool.query(
            `SELECT verification_id FROM employment_verifications
             WHERE user_id = $1 AND company_id = $2 AND status = 'approved'`,
            [userId, companyId]
        );

        if (verificationResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You must verify your employment before submitting a review'
            });
        }

        const { reviewId, transactionHash, blockNumber, gasUsed, reviewHash } = blockchainData;

        console.log(`✓ Review ${reviewId} submitted to blockchain by user: ${transactionHash}`);

        // Store metadata in database
        await pool.query(
            `INSERT INTO review_metadata
             (review_id, user_id, company_id, wallet_address, blockchain_tx_hash, block_number, review_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [reviewId, userId, companyId, walletAddress, transactionHash, blockNumber, reviewHash]
        );

        // Hash reviewer identity (using wallet address)
        const reviewerHash = hashEmail(walletAddress);
        
        // Hash employment proof
        const employmentProof = employeeId ? hashEmployeeId(employeeId) : reviewerHash;

        // Store in cache for fast queries
        const timestamp = Math.floor(Date.now() / 1000);
        await pool.query(
            `INSERT INTO review_cache
             (review_id, company_id, company_name, rating, review_text, reviewer_hash, employment_proof_hash, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [reviewId, companyId, company.company_name, rating, reviewText || '', reviewerHash, employmentProof, timestamp]
        );

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                reviewId,
                transactionHash,
                blockNumber: blockNumber.toString(),
                gasUsed: gasUsed.toString(),
                reviewHash
            }
        });
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
}

/**
 * Get review by ID
 */
async function getReviewById(req, res) {
    const { id } = req.params;

    try {
        // Get from cache first
        const result = await pool.query(`
            SELECT
                rc.*,
                rm.blockchain_tx_hash,
                rm.block_number,
                rm.is_published,
                TO_TIMESTAMP(rc.timestamp) as review_date
            FROM review_cache rc
            JOIN review_metadata rm ON rc.review_id = rm.review_id
            WHERE rc.review_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review',
            error: error.message
        });
    }
}

/**
 * Verify review on blockchain
 */
async function verifyReview(req, res) {
    const { id } = req.params;

    try {
        // Get review from database
        const dbResult = await pool.query(
            'SELECT review_hash, blockchain_tx_hash FROM review_metadata WHERE review_id = $1',
            [id]
        );

        if (dbResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found in database'
            });
        }

        const { review_hash, blockchain_tx_hash } = dbResult.rows[0];

        // Get review from blockchain
        const blockchainReview = await blockchainService.getReview(id);

        // Verify hash matches
        const isValid = blockchainReview.reviewHash === review_hash;

        res.json({
            success: true,
            data: {
                reviewId: id,
                isValid,
                database: {
                    reviewHash: review_hash,
                    transactionHash: blockchain_tx_hash
                },
                blockchain: {
                    reviewHash: blockchainReview.reviewHash,
                    rating: blockchainReview.rating,
                    timestamp: blockchainReview.timestamp.toString(),
                    companyId: blockchainReview.companyId
                }
            }
        });
    } catch (error) {
        console.error('Verify review error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: error.message
        });
    }
}

/**
 * Get user's reviews
 */
async function getUserReviews(req, res) {
    const { walletAddress } = req.params;

    try {
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Look up user by wallet address
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
            [walletAddress]
        );

        if (userResult.rows.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const userId = userResult.rows[0].user_id;

        const result = await pool.query(`
            SELECT
                rc.*,
                rm.blockchain_tx_hash,
                rm.block_number,
                TO_TIMESTAMP(rc.timestamp) as review_date
            FROM review_cache rc
            JOIN review_metadata rm ON rc.review_id = rm.review_id
            WHERE rm.user_id = $1
            ORDER BY rc.timestamp DESC
        `, [userId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
}

/**
 * Prepare review data for blockchain submission
 * Returns hashes and reviewId that frontend will use to submit transaction
 */
async function prepareReview(req, res) {
    const { companyId, rating, reviewText, employeeId, walletAddress } = req.body;

    try {
        // Validate input
        if (!companyId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Company ID and rating are required'
            });
        }

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Look up user by wallet address
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
            [walletAddress]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please verify employment first.'
            });
        }

        const userId = userResult.rows[0].user_id;

        // Check employment verification
        const verificationResult = await pool.query(
            `SELECT verification_id FROM employment_verifications
             WHERE user_id = $1 AND company_id = $2 AND status = 'approved'`,
            [userId, companyId]
        );

        if (verificationResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You must verify your employment before submitting a review'
            });
        }

        // Generate review ID
        const reviewId = generateReviewId();

        // Hash reviewer identity (using wallet address)
        const reviewerHash = hashEmail(walletAddress);

        // Hash employment proof
        const employmentProof = employeeId ? hashEmployeeId(employeeId) : reviewerHash;

        // Create review content for hashing
        const timestamp = Math.floor(Date.now() / 1000);
        const reviewData = {
            companyId,
            rating,
            reviewText: reviewText || '',
            timestamp
        };

        // Hash the full review content
        const reviewHash = hashReviewContent(reviewData);

        res.json({
            success: true,
            data: {
                reviewId,
                companyId,
                reviewerHash,
                reviewHash,
                rating,
                employmentProof
            }
        });
    } catch (error) {
        console.error('Prepare review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to prepare review',
            error: error.message
        });
    }
}

module.exports = {
    submitReview,
    prepareReview,
    getReviewById,
    verifyReview,
    getUserReviews
};
