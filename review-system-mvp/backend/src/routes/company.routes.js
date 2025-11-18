const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', companyController.getAllCompanies);
router.get('/search', companyController.searchCompanies);
router.get('/:id', companyController.getCompanyById);
router.get('/:id/reviews', companyController.getCompanyReviews);

// Protected routes
router.post('/', authenticateToken, companyController.createCompany);

module.exports = router;
