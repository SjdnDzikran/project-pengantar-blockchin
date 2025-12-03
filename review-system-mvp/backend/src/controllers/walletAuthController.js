const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const crypto = require('crypto');

/**
 * Generate a nonce for wallet authentication
 */
function generateNonce() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Get nonce for wallet address (creates user if not exists)
 */
async function getNonce(req, res) {
    const { walletAddress } = req.params;

    try {
        // Validate wallet address format
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address'
            });
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Check if user exists
        let userResult = await pool.query(
            'SELECT user_id, wallet_address, nonce FROM users WHERE LOWER(wallet_address) = $1',
            [normalizedAddress]
        );

        let nonce;
        if (userResult.rows.length === 0) {
            // Create new user with wallet address
            nonce = generateNonce();
            const insertResult = await pool.query(
                `INSERT INTO users (wallet_address, nonce, email, email_hash, password_hash)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING user_id, wallet_address, nonce`,
                [normalizedAddress, nonce, `${normalizedAddress}@wallet.local`, normalizedAddress, 'WALLET_AUTH']
            );
            userResult = insertResult;
        } else {
            // Generate new nonce for existing user
            nonce = generateNonce();
            await pool.query(
                'UPDATE users SET nonce = $1 WHERE LOWER(wallet_address) = $2',
                [nonce, normalizedAddress]
            );
        }

        res.json({
            success: true,
            data: {
                nonce,
                message: `Sign this message to authenticate: ${nonce}`
            }
        });
    } catch (error) {
        console.error('Get nonce error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate nonce',
            error: error.message
        });
    }
}

/**
 * Verify signature and authenticate wallet
 */
async function verifySignature(req, res) {
    const { walletAddress, signature } = req.body;

    try {
        // Validate inputs
        if (!walletAddress || !signature) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address and signature are required'
            });
        }

        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address'
            });
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Get user and nonce
        const userResult = await pool.query(
            'SELECT user_id, wallet_address, nonce, full_name FROM users WHERE LOWER(wallet_address) = $1',
            [normalizedAddress]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please request a nonce first.'
            });
        }

        const user = userResult.rows[0];

        // Verify signature
        const message = user.nonce;
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
            return res.status(401).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        // Generate new nonce for next login
        const newNonce = generateNonce();
        await pool.query(
            'UPDATE users SET nonce = $1, last_login = NOW() WHERE user_id = $2',
            [newNonce, user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                walletAddress: user.wallet_address
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Authentication successful',
            data: {
                user: {
                    userId: user.user_id,
                    walletAddress: user.wallet_address,
                    fullName: user.full_name
                },
                token
            }
        });
    } catch (error) {
        console.error('Verify signature error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify signature',
            error: error.message
        });
    }
}

/**
 * Get current user info (for authenticated requests)
 */
async function getCurrentUser(req, res) {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'SELECT user_id, wallet_address, full_name, created_at FROM users WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message
        });
    }
}

module.exports = {
    getNonce,
    verifySignature,
    getCurrentUser
};
