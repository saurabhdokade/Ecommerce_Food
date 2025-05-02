const mongoose = require("mongoose");
const { Schema } = mongoose;

// Review Schema
const reviewSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", // Assuming a Product model exists
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersAuth", // Assuming a User model exists
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: false,
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create a Review model
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
