const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const customizationSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['add', 'remove', 'spice-level'], required: true },
    options: [{ type: String, required: true }]
}, { _id: false });

const productSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersAuth",
        },
        productCode: {
            type: String,
            trim: true,
            unique: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        subcategory: {
            type: String,
            trim: true,
        },
        productName: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        productSubType: {
            type: String,
            required: [true, "Product Sub Type is required"],
            trim: true,
        },
        productDescription: {
            type: String,
            required: [true, "Product Description is required"],
            trim: true,
        },
        price: {
            type: String,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        quantityInEachPack: {
            type: String,
            required: [true, "Quantity in each pack is required"],
        },
        image: {
            type: [String],
        },
        ingredients: {
            type: [String],
            default: [],
        },
        calories: {
            type: Number,
            min: 0,
        },
        customizations: [customizationSchema],
        availabilityStatus: {
            type: String,
            enum: ["In Stock", "Out of Stock", "Pre-order"],
            default: "In Stock",
        },
        reviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Review", // Reference to the Review model
            },
        ],
        popularity: {
            type: Number, // Can represent the popularity of the product
            default: 0,
        },
        sku: {
            type: String,
            unique: true,
            sparse: true,
        },
        barcode: {
            type: String,
            unique: true,
            sparse: true,
        },
        couponCode: { type: String, default: '' }, // Coupon code for the product
        discountType: { type: String, enum: ['flat', 'percentage'], default: null },
        discountValue: { type: Number, default: 0 },
        finalPrice: { type: Number },
        availableProductQuantity: {
            type: Number,
            required: [true, "Available Product Quantity is required"],
            min: [0, "Available Product Quantity cannot be negative"],
        },
        relatedProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
        }],
    },
    { timestamps: true }
);

const ProductModel = model("Products", productSchema);
module.exports = ProductModel;
