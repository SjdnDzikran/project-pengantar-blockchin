const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.post('/', authenticateToken, verificationController.submitVerification);
router.get('/', authenticateToken, verificationController.getUserVerifications);
router.get('/:companyId', authenticateToken, verificationController.checkVerification);

module.exports = router;
