const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');

// Public routes
router.get('/', companyController.getAllCompanies);
router.get('/search', companyController.searchCompanies);
router.get('/:id', companyController.getCompanyById);
router.get('/:id/reviews', companyController.getCompanyReviews);

// Wallet-protected routes
router.post('/', companyController.createCompany);

module.exports = router;
