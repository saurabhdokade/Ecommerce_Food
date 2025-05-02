const statusEnum = [
    "Order Placed",
    "Delivered",
    "OrderCancelled",
    "Cancelled",
    "Confirmed",
    "In Process",
    "Order Confirmed",
    "Out for Delivery",
  ];
   
  const mongoose = require("mongoose");
   
  const orderSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersAuth",
        required: true,
      },
      deliveryStatus: {
        type: String,
        enum: ["In Process", "Accepted", "Cancelled", "Delivered"],
        default: "In Process"
      },
      deliveryAddress: {
        name: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true },
      },
      paymentMethod: {
        type: String,
        enum: ["Cash", "Online"],
        default: "Cash",
      },
      paymentMode:{
        type:Boolean,
        default:false
      },
      cashReceived: {
        type: Boolean,
        default: false
      },
    //   emergencyDelivery: {
    //     type: Boolean,
    //     default: false,
    //   },
      totalAmount: {
        type: Number,
        required: true,
      },
      items: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
            required: true,
          },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
        },
      ],
      orderSummary: {
        productImage: { type: String },
        items: { type: Number },
        itemTotal: { type: Number },
        deliveryCharges: { type: Number },
        orderTotal: { type: Number },
      },
      status: {
        type: String,
        enum: statusEnum,
        default: "In Process",
      },
      couponCode: { type: String, default: '' }, 
      couponDiscount: { type: Number, default: 0 },
      cancelReason: {
        type: String,
        enum: [
          // Customer reasons
          "I want to change the Product",
          "Not available on the delivery time",
          "Price High",
          "I ordered wrong Product",
          // Delivery boy reasons
          "Vehicle Mechanical Issue",
          "Not Feeling Well",
          "Emergency or Personal Reason",
          "Rescheduling After Sometime",
          "Other",
        ],
      },
   
      // ✅ Optional custom text if "Other" selected
      otherReason: {
        type: String,
        default: null,
      },
   
      // ✅ Who cancelled the order
      cancelledBy: {
        type: String,
        enum: ["Customer", "Delivery Boy"],
        default: null,
      },
   
      // ✅ Timestamp of cancellation
      cancelDate: {
        type: Date,
        default: null,
      },
   
      orderId: {
        type: String,
        unique: true,
        required: true,
      },
      orderDate: {
        type: Date,
        default: Date.now,
      },
      deliveryDate:{
        type: Date,
        default: Date.now,
      },
      deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryBoy",
        required: false,
      },
      outForDeliveryAt: { 
        type: Date, 
        default: null 
      }, 
      razorpayPaymentLinkId: {
        type: String,  // Ensure the type matches the one sent by Razorpay
        required: false,
        unique: true,  // You can make this field unique to prevent duplicates
      },
      razorpayOrderId: {
        type: String,
        required: false,
      },
      razorpayPaymentId: {
        type: String,
        required: false,
      },
      razorpayLinkId: {
        type: String
      },
      razorpayLinkStatus: {
        type: String,
        enum: ["created", "paid", "expired", "cancelled"],
        default: "created"
      },
   
    },
    { timestamps: true }
  );
   
  const Order = mongoose.model("OrderCart", orderSchema);
  module.exports = Order;