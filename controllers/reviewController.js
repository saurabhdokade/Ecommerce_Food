const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHander = require("../utils/errorhandler");
const Review = require("../model/reviewModel");
const Product = require("../model/productModel");
const User = require("../model/userModel");

// Create a Review
exports.createReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, reviewText } = req.body;
    const productId = req.params.productId;  
  
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return next(new ErrorHander("Unauthorized. User not found in request.", 401));
    }
  
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHander("Product not found", 404));
    }
  
  
    if (rating < 1 || rating > 5) {
      return next(new ErrorHander("Rating must be between 1 and 5.", 400));
    }
  
    const isVerifiedBuyer = true; 
  
    const newReview = new Review({
      productId,
      userId,
      rating,
      reviewText,
      isVerifiedBuyer,
    });
  
    await newReview.save();
  
    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: newReview,
    });
  });



// Get reviews for a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
  
    // Fetch all reviews for the product
    const reviews = await Review.find({ productId }).populate("userId", "name email");
  
    res.status(200).json({
      success: true,
      reviews,
    });
  });

  // Get reviews with optional filtering and sorting
exports.getReviews = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;  
    const { rating, isVerifiedBuyer, sortBy, sortOrder } = req.query;  
  
    // Build the filter query
    let filter = {};
    if (productId) {
      filter.productId = productId;  
    }
    if (rating) {
      filter.rating = { $gte: parseInt(rating) };  
    }
    if (isVerifiedBuyer) {
      filter.isVerifiedBuyer = isVerifiedBuyer === "true";  
    }
  
    // Build the sort query
    let sort = {};
    if (sortBy === "date") {
      sort.createdAt = sortOrder === "desc" ? -1 : 1; 
    } else if (sortBy === "rating") {
      sort.rating = sortOrder === "desc" ? -1 : 1; 
    } else {
      sort.createdAt = -1; 
    }
  
    // Fetch the reviews with filter and sorting
    const reviews = await Review.find(filter).sort(sort);
  
    if (!reviews || reviews.length === 0) {
      return next(new ErrorHander("No reviews found for the given criteria.", 404));
    }
  
    res.status(200).json({
      success: true,
      reviews,
    });
  });
  