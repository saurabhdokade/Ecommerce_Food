const ProductModel = require("../model/productModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHander = require("../utils/errorhandler");
const Review = require("../model/reviewModel");

// Capitalize first letter of each word
const capitalizeWords = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  const {
    category,
    subcategory,
    productName,
    productSubType,
    productDescription,
    price,
    quantityInEachPack,
    ingredients,
    calories,
    availabilityStatus,
    sku,
    barcode,
    availableProductQuantity,
    discountType, // "flat" or "percentage"
    discountValue, // numeric
    couponCode, // New field for coupon code
  } = req.body;

  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return next(new ErrorHander("Unauthorized. User not found in request.", 401));
  }

  if (
    !category || !productName || !productSubType || !productDescription ||
    !price || !quantityInEachPack || availableProductQuantity == null
  ) {
    return next(new ErrorHander("All required fields must be provided", 400));
  }

  // Handle image uploads
  let imagePaths = [];
  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map((file) => file.path);
  } else {
    return next(new ErrorHander("No image uploaded for the product.", 400));
  }

  const formattedProductName = capitalizeWords(productName);

  const existingProduct = await ProductModel.findOne({
    $or: [{ sku }, { barcode }],
  });
  if (existingProduct) {
    return next(new ErrorHander("Product with same SKU or Barcode already exists", 409));
  }

  if (price <= 0 || availableProductQuantity <= 0) {
    return next(new ErrorHander("Price and quantity must be greater than zero.", 400));
  }

  const skuRegex = /^[A-Z0-9]{8}$/;
  if (!skuRegex.test(sku)) {
    return next(new ErrorHander("Invalid SKU format.", 400));
  }

  // Generate productCode
  const lastProduct = await ProductModel.findOne({
    productCode: { $regex: /^PR\d{4}$/ },
  }).sort({ productCode: -1 });

  const newProductCode = lastProduct
    ? `PR${(parseInt(lastProduct.productCode.slice(2)) + 1).toString().padStart(4, "0")}`
    : "PR0001";

  // Calculate final price after discount
  let finalPrice = price;

  if (discountType === "flat") {
    finalPrice = price - discountValue;
  } else if (discountType === "percentage") {
    finalPrice = price - (price * (discountValue / 100));
  }

  if (finalPrice < 0) {
    return next(new ErrorHander("Final price cannot be negative", 400));
  }

  const newProduct = new ProductModel({
    user: userId,
    productCode: newProductCode,
    category,
    subcategory,
    productName: formattedProductName,
    productSubType,
    productDescription,
    price,
    discountType,
    discountValue,
    couponCode, // Saving the coupon code to the product
    finalPrice,
    quantityInEachPack,
    image: imagePaths,
    ingredients,
    calories,
    availabilityStatus,
    sku,
    barcode,
    availableProductQuantity,
  });

  await newProduct.save();

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: newProduct,
  });
});






exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const {
    category,
    subcategory,
    productName,
    productSubType,
    productDescription,
    price,
    quantityInEachPack,
    ingredients,
    calories,
    availabilityStatus,
    sku,
    barcode,
    availableProductQuantity,
  } = req.body;

  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return next(new ErrorHander("Unauthorized. User not found in request.", 401));
  }

  const existingProduct = await ProductModel.findById(id);
  if (!existingProduct) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Ensure SKU/barcode uniqueness if changed
  if ((sku && sku !== existingProduct.sku) || (barcode && barcode !== existingProduct.barcode)) {
    const duplicateProduct = await ProductModel.findOne({
      $or: [{ sku }, { barcode }],
      _id: { $ne: id },
    });
    if (duplicateProduct) {
      return next(new ErrorHander("Another product with same SKU or Barcode already exists", 409));
    }
  }

  // SKU validation
  const skuRegex = /^[A-Z0-9]{8}$/;
  if (sku && !skuRegex.test(sku)) {
    return next(new ErrorHander("Invalid SKU format.", 400));
  }

  // Validation
  if (
    !category || !productName || !productSubType || !productDescription ||
    !price || !quantityInEachPack || availableProductQuantity == null
  ) {
    return next(new ErrorHander("All required fields must be provided", 400));
  }

  if (price <= 0 || availableProductQuantity <= 0) {
    return next(new ErrorHander("Price and quantity must be greater than zero.", 400));
  }

  // Handle images
  let imagePaths = existingProduct.image;
  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map((file) => file.path);
  }

  const formattedProductName = capitalizeWords(productName);

  // Update fields
  existingProduct.set({
    user: userId,
    category,
    subcategory,
    productName: formattedProductName,
    productSubType,
    productDescription,
    price,
    quantityInEachPack,
    image: imagePaths,
    ingredients,
    calories,
    availabilityStatus,
    sku,
    barcode,
    availableProductQuantity,
  });

  await existingProduct.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: existingProduct,
  });
});



exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await ProductModel.find();

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});


exports.getProductById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const product = await ProductModel.findById(id).lean(); // .lean() makes it a plain object for easier modification
  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Fetch all reviews for this product
  const reviews = await Review.find({ productId: id }).populate("userId", "name email");

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : null;

  res.status(200).json({
    success: true,
    product,
    reviews,
    totalReviews: reviews.length,
    averageRating: averageRating,
  });
});
