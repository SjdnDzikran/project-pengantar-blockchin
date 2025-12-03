const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const walletAuthController = require('../controllers/walletAuthController');
const { authenticateToken } = require('../middleware/auth');

// Legacy email/password routes (kept for backwards compatibility)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Wallet-based authentication routes
router.get('/wallet/nonce/:walletAddress', walletAuthController.getNonce);
router.post('/wallet/verify', walletAuthController.verifySignature);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/me', authenticateToken, walletAuthController.getCurrentUser);

module.exports = router;
