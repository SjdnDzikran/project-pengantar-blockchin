const pool = require('../config/database');
const { hashEmployeeId } = require('../utils/hash');

/**
 * Submit employment verification
 */
async function submitVerification(req, res) {
    const { companyId, employeeId, walletAddress } = req.body;

    try {
        // Validate input
        if (!companyId || !employeeId || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Company ID, employee ID, and wallet address are required'
            });
        }

        // Check if company exists
        const companyResult = await pool.query(
            'SELECT company_id FROM companies WHERE company_id = $1',
            [companyId]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Get or create user by wallet address
        let userResult = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
            [walletAddress]
        );

        let userId;
        if (userResult.rows.length === 0) {
            // Create new user
            const newUser = await pool.query(
                `INSERT INTO users (wallet_address, email, email_hash, password_hash)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id`,
                [walletAddress.toLowerCase(), `${walletAddress.toLowerCase()}@wallet.local`, walletAddress.toLowerCase(), 'WALLET_AUTH']
            );
            userId = newUser.rows[0].user_id;
        } else {
            userId = userResult.rows[0].user_id;
        }

        // Check if verification already exists
        const existingVerification = await pool.query(
            `SELECT verification_id, status FROM employment_verifications
             WHERE user_id = $1 AND company_id = $2`,
            [userId, companyId]
        );

        if (existingVerification.rows.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Verification already exists for this company',
                data: {
                    status: existingVerification.rows[0].status,
                    isVerified: existingVerification.rows[0].status === 'approved'
                }
            });
        }

        // Hash employee ID for privacy
        const employeeIdHash = hashEmployeeId(employeeId);

        // Create verification (auto-approve for MVP)
        const result = await pool.query(
            `INSERT INTO employment_verifications
             (user_id, company_id, employee_id_hash, wallet_address, status, verified_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING verification_id, status, created_at, verified_at`,
            [userId, companyId, employeeIdHash, walletAddress, 'approved']
        );

        res.status(201).json({
            success: true,
            message: 'Employment verification submitted and approved',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit verification',
            error: error.message
        });
    }
}

/**
 * Get user's verifications
 */
async function getUserVerifications(req, res) {
    const userId = req.user.userId;

    try {
        const result = await pool.query(`
            SELECT
                ev.verification_id,
                ev.company_id,
                c.company_name,
                c.industry,
                ev.status,
                ev.verified_at,
                ev.created_at
            FROM employment_verifications ev
            JOIN companies c ON ev.company_id = c.company_id
            WHERE ev.user_id = $1
            ORDER BY ev.created_at DESC
        `, [userId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get verifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch verifications',
            error: error.message
        });
    }
}

/**
 * Check if user is verified for a company
 */
async function checkVerification(req, res) {
    const { companyId, walletAddress } = req.params;

    try {
        // Get user by wallet address
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
            [walletAddress]
        );

        if (userResult.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    isVerified: false,
                    message: 'User not found'
                }
            });
        }

        const userId = userResult.rows[0].user_id;

        const result = await pool.query(
            `SELECT verification_id, status, verified_at
             FROM employment_verifications
             WHERE user_id = $1 AND company_id = $2`,
            [userId, companyId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    isVerified: false,
                    message: 'No verification found'
                }
            });
        }

        const verification = result.rows[0];
        res.json({
            success: true,
            data: {
                isVerified: verification.status === 'approved',
                status: verification.status,
                verifiedAt: verification.verified_at
            }
        });
    } catch (error) {
        console.error('Check verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check verification',
            error: error.message
        });
    }
}

module.exports = {
    submitVerification,
    checkVerification
};
