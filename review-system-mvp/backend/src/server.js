const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const pool = require('./config/database');
const blockchainService = require('./config/blockchain');

// Import routes
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const reviewRoutes = require('./routes/review.routes');
const verificationRoutes = require('./routes/verification.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database
        await pool.query('SELECT 1');

        // Check blockchain
        const blockchainStatus = blockchainService.initialized;

        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                blockchain: blockchainStatus ? 'connected' : 'disconnected'
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/verifications', verificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Company Review System API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            companies: '/api/companies',
            reviews: '/api/reviews',
            verifications: '/api/verifications'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize and start server
async function startServer() {
    try {
        console.log('='.repeat(60));
        console.log('Company Review System - Backend API');
        console.log('='.repeat(60));

        // Test database connection
        console.log('\n[1/3] Connecting to database...');
        const dbResult = await pool.query('SELECT NOW()');
        console.log(`✓ Database connected at ${dbResult.rows[0].now}`);

        // Initialize blockchain service
        console.log('\n[2/3] Connecting to blockchain...');
        const blockchainConnected = await blockchainService.initialize();
        if (blockchainConnected) {
            console.log('✓ Blockchain service initialized');
        } else {
            console.warn('⚠ Blockchain service not fully initialized - review submission may fail');
        }

        // Start server
        console.log('\n[3/3] Starting HTTP server...');
        app.listen(PORT, () => {
            console.log('✓ Server started successfully');
            console.log('\n' + '='.repeat(60));
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('='.repeat(60));
            console.log('\nAPI Endpoints:');
            console.log(`  Health Check: http://localhost:${PORT}/health`);
            console.log(`  API Base:     http://localhost:${PORT}/api`);
            console.log('\nReady to accept requests...\n');
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n\nReceived SIGTERM signal, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT signal, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

// Start the server
startServer();
