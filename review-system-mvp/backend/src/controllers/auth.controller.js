const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { hashEmail } = require('../utils/hash');

/**
 * Register new user
 */
async function register(req, res) {
    const { email, password, fullName } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Hash email for blockchain privacy
        const emailHash = hashEmail(email);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, email_hash, password_hash, full_name, is_verified)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, email, full_name, created_at`,
            [email.toLowerCase(), emailHash, passwordHash, fullName, true]
        );

        const user = result.rows[0];

        // Generate token
        const token = generateToken({
            userId: user.user_id,
            email: user.email
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    userId: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    createdAt: user.created_at
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
}

/**
 * Login user
 */
async function login(req, res) {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const result = await pool.query(
            'SELECT user_id, email, password_hash, full_name, is_verified FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = $1',
            [user.user_id]
        );

        // Generate token
        const token = generateToken({
            userId: user.user_id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    userId: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    isVerified: user.is_verified
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
    try {
        const result = await pool.query(
            `SELECT user_id, email, full_name, created_at, last_login, is_verified
             FROM users WHERE user_id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        // Get user statistics
        const stats = await pool.query(
            `SELECT COUNT(*) as review_count FROM review_metadata WHERE user_id = $1`,
            [req.user.userId]
        );

        res.json({
            success: true,
            data: {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isVerified: user.is_verified,
                reviewCount: parseInt(stats.rows[0].review_count)
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
}

module.exports = {
    register,
    login,
    getProfile
};
