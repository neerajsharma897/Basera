const express = require("express");
const router = express.Router({ mergeParams: true });// to allow us to access the params of the parent router
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, validateReview, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/review.js");

// Create reviews
router.post("/",isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// delete review
router.delete("/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;