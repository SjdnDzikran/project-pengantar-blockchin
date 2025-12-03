const pool = require('../config/database');
const { hashCompanyName } = require('../utils/hash');

/**
 * Get all companies
 */
async function getAllCompanies(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                c.*,
                COALESCE(cs.total_reviews, 0) as total_reviews,
                COALESCE(cs.average_rating, 0) as average_rating
            FROM companies c
            LEFT JOIN company_statistics cs ON c.company_id = cs.company_id
            ORDER BY c.company_name ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch companies',
            error: error.message
        });
    }
}

/**
 * Get company by ID
 */
async function getCompanyById(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                c.*,
                cs.total_reviews,
                cs.average_rating,
                cs.five_star_count,
                cs.four_star_count,
                cs.three_star_count,
                cs.two_star_count,
                cs.one_star_count,
                cs.last_review_timestamp
            FROM companies c
            LEFT JOIN company_statistics cs ON c.company_id = cs.company_id
            WHERE c.company_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company',
            error: error.message
        });
    }
}

/**
 * Get company reviews
 */
async function getCompanyReviews(req, res) {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const result = await pool.query(`
            SELECT
                rc.*,
                TO_TIMESTAMP(rc.timestamp) as review_date
            FROM review_cache rc
            WHERE rc.company_id = $1
            ORDER BY rc.timestamp DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);

        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM review_cache WHERE company_id = $1',
            [id]
        );

        res.json({
            success: true,
            data: {
                reviews: result.rows,
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get company reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
}

/**
 * Search companies
 */
async function searchCompanies(req, res) {
    const { q, industry } = req.query;

    try {
        let query = `
            SELECT
                c.*,
                COALESCE(cs.total_reviews, 0) as total_reviews,
                COALESCE(cs.average_rating, 0) as average_rating
            FROM companies c
            LEFT JOIN company_statistics cs ON c.company_id = cs.company_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (q) {
            query += ` AND c.company_name ILIKE $${paramIndex}`;
            params.push(`%${q}%`);
            paramIndex++;
        }

        if (industry) {
            query += ` AND c.industry = $${paramIndex}`;
            params.push(industry);
            paramIndex++;
        }

        query += ' ORDER BY c.company_name ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Search companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
}

/**
 * Create new company (admin only for MVP)
 */
async function createCompany(req, res) {
    const { companyName, industry, location, website, description, walletAddress } = req.body;

    try {
        // Validate input
        if (!companyName) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Generate company ID hash
        const companyId = hashCompanyName(companyName);

        // Check if company exists
        const existing = await pool.query(
            'SELECT company_id FROM companies WHERE company_id = $1',
            [companyId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Company already exists'
            });
        }

        // Create company
        const result = await pool.query(
            `INSERT INTO companies (company_id, company_name, industry, location, website, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [companyId, companyName, industry, location, website, description]
        );

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create company',
            error: error.message
        });
    }
}

module.exports = {
    getAllCompanies,
    getCompanyById,
    getCompanyReviews,
    searchCompanies,
    createCompany
};
