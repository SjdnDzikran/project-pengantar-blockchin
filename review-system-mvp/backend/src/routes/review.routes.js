const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticateToken } = require('../middleware/auth');

// Protected routes
router.post('/', authenticateToken, reviewController.submitReview);
router.get('/user', authenticateToken, reviewController.getUserReviews);
router.get('/:id', reviewController.getReviewById);
router.get('/:id/verify', reviewController.verifyReview);

module.exports = router;
