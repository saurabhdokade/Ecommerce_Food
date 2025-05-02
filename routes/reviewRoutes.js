const express = require("express");
const router = express.Router();

const { createReview,getProductReviews,getReviews } = require("../controllers/reviewController");
const { isAuthenticatedUser } = require("../middlewares/auth");

// Create a review route
router.post("/:productId/create", isAuthenticatedUser, createReview);
router.get("/review/:productId", isAuthenticatedUser, getProductReviews);
router.get("/:productId", getReviews);

module.exports = router;

