const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

// Wallet-protected routes
router.post('/prepare', reviewController.prepareReview);
router.post('/', reviewController.submitReview);
router.get('/user/:walletAddress', reviewController.getUserReviews);
router.get('/:id', reviewController.getReviewById);
router.get('/:id/verify', reviewController.verifyReview);

module.exports = router;
