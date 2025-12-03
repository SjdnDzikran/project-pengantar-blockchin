const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');

// Routes no longer require authentication - use wallet address from request body
router.post('/', verificationController.submitVerification);
router.get('/:companyId/:walletAddress', verificationController.checkVerification);

module.exports = router;
