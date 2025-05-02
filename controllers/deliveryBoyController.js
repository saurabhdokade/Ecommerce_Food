const Order = require("../model/orderNow");
const mongoose = require("mongoose")
// const userNotificationModel = require(".././models/UserModels/userNotification");
const Razorpay = require("razorpay");
const User = require("../model/userModel");
const DeliveryBoy = require("../model/deliveryBoyModel")
const validator = require("validator");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");

const registerdeliveryBoy = async (req, res) => {
    try {
      const { fullName, email, phoneNumber, userId, password, address } = req.body;
      const image = req.file?.path || undefined;
  
      // Field validation
      if (!fullName || !email || !phoneNumber || !userId || !password || !address) {
        return res.status(400).json({ success: false, message: "All fields are required." });
      }
  
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }
  
      if (!/^\d{10}$/.test(phoneNumber)) {
        return res.status(400).json({ success: false, message: "Phone number must be 10 digits." });
      }
  
      // Check for duplicates
      const existingUser = await DeliveryBoy.findOne({
        $or: [{ email }, { phoneNumber }, { userId }],
      });
  
      if (existingUser) {
        let conflictField = existingUser.email === email ? "Email" :
                            existingUser.phoneNumber.toString() === phoneNumber ? "Phone number" :
                            existingUser.userId === userId ? "User ID" : "Field";
        return res.status(400).json({
          success: false,
          message: `${conflictField} already exists.`,
        });
      }
  
      // Create and save delivery boy (password will be hashed by pre-save hook)
      const newDeliveryBoy = new DeliveryBoy({
        fullName,
        email,
        phoneNumber,
        userId,
        password,
        address,
        image,
      });
  
      await newDeliveryBoy.save();
  
      res.status(201).json({
        success: true,
        message: "Delivery boy registered successfully!",
        deliveryBoy: {
          id: newDeliveryBoy._id,
          fullName: newDeliveryBoy.fullName,
          email: newDeliveryBoy.email,
          phoneNumber: newDeliveryBoy.phoneNumber,
          userId: newDeliveryBoy.userId,
          address: newDeliveryBoy.address,
          profileImage: newDeliveryBoy.image,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
  };
  
  
const LoginDeliveryBoy = async (req, res) => {
    try {
      const { userId, password } = req.body;
  
      const deliveryBoy = await DeliveryBoy.findOne({ userId });
      if (!deliveryBoy) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const isMatch = await deliveryBoy.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const token = jwt.sign({ id: deliveryBoy._id }, process.env.JWT_SECRET, {
        expiresIn: "1y",
      });
  
      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        deliveryBoy: {
          id: deliveryBoy._id,
          fullName: deliveryBoy.fullName,
          email: deliveryBoy.email,
          phoneNumber: deliveryBoy.phoneNumber,
          userId: deliveryBoy.userId,
          address: deliveryBoy.address,
          profileImage: deliveryBoy.image,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_D3D9CzhhPmwAZe",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "gTPUidHTVpnljtGjLZHUcFV4",
});


//✅ Accept delivery Boy Order
const acceptOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy?.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryBoy && order.deliveryStatus === "Accepted") {
      return res.status(400).json({
        message: "Order already accepted",
        deliveryBoyId: order.deliveryBoy,
      });
    }

    order.deliveryBoy = deliveryBoyId;
    order.deliveryStatus = "Accepted";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      deliveryBoyId: deliveryBoyId,
    });

  } catch (error) {
    console.error("Accept order error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

 
//✅ Cancel delivery Boy Order
const canceldeliveryBoyOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy?.id.toString();
    const { id } = req.params;
    const { cancelReason, otherReason } = req.body;

    const validReasons = [
      "I want to change the Product",
      "Not available on the delivery time",
      "Price High",
      "I ordered wrong Product",
      "Other",
    ];

    if (!validReasons.includes(cancelReason)) {
      return res.status(400).json({ message: "Invalid cancellation reason." });
    }

    if (cancelReason === "Other" && (!otherReason || otherReason.trim() === "")) {
      return res.status(400).json({ message: "Please provide a reason for cancellation." });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure only assigned delivery boy can cancel
    if (order.deliveryBoy?.toString() !== deliveryBoyId) {
      return res.status(403).json({ message: "You are not assigned to this order." });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    // Cancel the order
    order.deliveryBoy = null;
    order.deliveryStatus = "Cancelled"; 
    order.status = "Cancelled";
    order.cancelReason = cancelReason;
    order.otherReason = cancelReason === "Other" ? otherReason : "N/A";

    await order.save();

   

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully by delivery boy",
      cancelReason: order.cancelReason,
      otherReason: order.otherReason,
    });

  } catch (error) {
    console.error("Cancel delivery order error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
  
  //✅ Get available orders for delivery boy
  const getAvailableOrders = async (req, res) => {
    try {
      const deliveryBoyId = req.deliveryBoy?.id;
  
      if (!deliveryBoyId) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }
  
      const orders = await Order.find({
        deliveryBoy: deliveryBoyId, 
        $or: [
          { status: { $regex: /^In Process$/i } },
          { deliveryStatus: { $regex: /^(In Process|Pending)$/i } }
        ]
      })
        .populate("user", "fullName")
        .populate({
          path: "items.product",
          select: "productName image user",
          populate: {
            path: "user",
            select: "fullName"
          }
        })
        .sort({ createdAt: -1 });
  
      const formattedOrders = orders.map(order => {
        const firstItem = order.items?.[0];
        const product = firstItem?.product;
  
        const buyerName = order.user?.fullName || "N/A";
        const sellerName =
          product?.user?.fullName || order.branchInfo?.branchName || "Seller";
        const productName = product?.productName || "N/A";
        const productImage = product?.image || "";
  
        const address = order.deliveryAddress;
        const fullAddress = `${address?.street || ""}, ${address?.city || ""}, ${address?.zipCode || ""}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
        return {
          id: order.id,
          orderId: order.orderId,
          productName,
          productImage,
          totalPrice: order.totalAmount,
          orderDate: order.createdAt,
          buyerName,
          sellerName,
          yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
          seeLocationUrl: googleMapsUrl,
          status: order.deliveryStatus || order.status || "In Process"
        };
      });
  
      res.status(200).json({ success: true, orders: formattedOrders });
    } catch (error) {
      console.error("Error fetching available orders:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching available orders",
        error: error.message
      });
    }
  };
  
  //✅ Get available order details
  const getavaliableOrderDetails = async (req, res) => {
    try {
      const deliveryBoyId = req.deliveryBoy?.id;
      const { id: orderId } = req.params; 
      if (!deliveryBoyId) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }
  
      const order = await Order.findOne({
        _id: orderId,
        deliveryBoy: deliveryBoyId
      })
        .populate("user", "fullName")
        // .populate("branchInfo", "branchName fullAddress")
        .populate({
          path: "items.product",
          select: "productName image user",
          populate: {
            path: "user",
            select: "fullName"
          }
        });
  
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      const firstItem = order.items?.[0];
      const product = firstItem?.product;
  
      const buyerName = order.user?.fullName || "N/A";
      const sellerName =
        product?.user?.fullName || order.branchInfo?.branchName || "Seller";
      const productName = product?.productName || "N/A";
      const productImage = product?.image || "";
      const price = order.totalAmount || 0;
  
      const address = order.deliveryAddress;
      const fullAddress = `${address?.street || ""}, ${address?.city || ""}, ${address?.zipCode || ""}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress};`
  
      const orderDetails = {
        orderId: order.orderId,
        productName,
        productImage,
        price,
        date:new Date(order.createdAt).toLocaleDateString('en-GB'),
        buyerName,
        sellerName,
        yourEarning:` ₹${(price * 0.10).toFixed(0)}`,
        seeLocationUrl: googleMapsUrl,
        status: order.deliveryStatus || order.status || "In Process"
      };
  
      res.status(200).json({ success: true, order: orderDetails });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching order details",
        error: error.message
      });
    }
  };
 
   //✅ Confirm payment
   const confirmPayment = async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
   
      const order = await Order.findById(id)
        .populate("user")
        .populate("items.product");
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      // 🚫 Already delivered? Stop.
      if (order.status === "Delivered" || order.deliveryStatus === "Delivered") {
        return res.status(400).json({ message: "Order already delivered, no further payment processing allowed." });
      }
   
      // 🚫 Already paid? Stop.
      if (order.paymentStatus === "Success") {
        return res.status(400).json({ message: "Payment already confirmed for this order." });
      }
   
      // 🚫 Delivery not accepted yet? Stop.
      if (order.deliveryStatus !== "Accepted") {
        return res.status(400).json({ message: "User has not accepted the delivery yet." });
      }
   
      const user = await User.findById(order.user);
      const productNames = order.items.map(item => {
        return `${item.product.productName} x${item.quantity}`;
      }).join(', ');
   
      // Store payment method
      order.paymentMethod = paymentMethod;
   
      // === Cash or COD Payment ===
      if (paymentMethod === "Cash" || paymentMethod === "COD") {
        order.cashReceived = true;
        order.paymentStatus = "Success";
        order.status = "Delivered";
        order.deliveryStatus = "Delivered";
        order.deliveryDate = new Date(); // <-- add this line
        await order.save();
   
        return res.status(200).json({
          message: "Cash payment confirmed and order delivered.",
          data: {
            orderId: order.orderId,
            amount: order.totalAmount,
            paymentMethod:order.paymentMethod,
            cashReceived: true,
            yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
            user: {
              fullName: order.user.fullName,
              gender: order.user.gender,
              phoneNumber: order.user.phoneNumber
            },
            orderDate: order.orderDate.toDateString(),
            orderTime: order.orderDate.toLocaleTimeString(),
            productDetails: order.items.map(item => ({
              name: item.product.productName,
              quantity: item.quantity,
              price: item.price
            }))
          }
        });
      }
   
      // === Online Payment ===
      if (paymentMethod === "Online") {
        const paymentLink = await razorpay.paymentLink.create({
          amount: order.totalAmount * 100,
          currency: "INR",
          accept_partial: false,
          description: `Order #${order.orderId} | ${order.items.map(item => `${item.product.productName} x${item.quantity}`).join(", ")}`,
          customer: {
            name: order.user.fullName,
            contact: order.user.phone.toString(),
          },
          notify: {
            sms: true,
            email: true,
          },
          notes: {
            "Order ID": order.orderId,
            "Product": productNames,
            "Delivery Slot": "12PM - 2PM",
            "Gender": user.gender,
            "Customer Name": user.fullName,
            "Phone Number": user.phoneNumber,
          },
          callback_url: "http://localhost:8000/api/order/payment/verify",
          callback_method: "get"
        });
   
        order.razorpayLinkId = paymentLink.id;
        order.razorpayLinkStatus = "created";
        await order.save();
   
        return res.status(200).json({
          message: "Online payment link created successfully",
          paymentUrl: paymentLink.short_url,
          paymentMethod: order.paymentMethod,
          orderId: order.orderId,
          user: {
            fullName: order.user.fullName,
            gender: order.user.gender,
           contactNumber: order.user.phoneNumber
          },
          orderDate: order.createdAt.toDateString(),
          timeSlot: paymentLink.notes["Delivery Slot"] || "Not specified",
          productDetails: order.items.map(item => ({
            name: item.product.productName,
            quantity: item.quantity,
            price: item.price
          })),
        });
      }
   
      return res.status(400).json({ message: "Invalid payment method" });
   
    } catch (err) {
      console.error("Payment confirmation error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
   
   
  //✅ Verify Online Payment
  const verifyOnlinePayment = async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_status } = req.query;
   
      // Fetch order using razorpayLinkId
      const order = await Order.findOne({ razorpayLinkId: razorpay_payment_link_id });
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      if (razorpay_payment_link_status === "paid") {
        order.paymentStatus = "Success";
        order.status = "Delivered";
        order.deliveryStatus = "Delivered";
        order.cashReceived = false; // because it's online
        await order.save();
   
        return res.status(200).json({
          message: "Online payment verified and order delivered",
          data: {
            orderId: order.orderId,
            paymentId: razorpay_payment_id,
            yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`
          }
        });
      }
   
      return res.status(400).json({ message: "Payment not completed yet" });
   
    } catch (error) {
      console.error("Payment verification error:", error);
      return res.status(500).json({ message: "Server error during payment verification" });
    }
  };


  //✅ Get delivery boy summary
  const getDeliveryBoySummary = async (req, res) => {
    try {
      const deliveryBoyId = req.deliveryBoyId?.id;
   
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
   
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
   
      const allDeliveredOrders = await Order.find({
        deliveryBoy: deliveryBoyId,
        deliveryStatus: "Delivered"
      }).populate("items.product");
   
      const totalEarnings = allDeliveredOrders.reduce((sum, order) => {
        return sum + (order.totalAmount * 0.10 || 0);
      }, 0);
   
      const todayDeliveredOrders = allDeliveredOrders.filter(order =>
        order.updatedAt >= todayStart && order.updatedAt <= todayEnd
      );
   
      const todayEarnings = todayDeliveredOrders.reduce((sum, order) => {
        return sum + (order.totalAmount * 0.10 || 0);
      }, 0);
   
      const detailedOrders = allDeliveredOrders.map(order => ({
        id:order.id,
        orderId: order.orderId,
        productName: order.items[0]?.product?.productName || "N/A",
        image: order.items[0]?.product?.image || null,
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
        status: order.status
      }));
   
      return res.status(200).json({
        summary: {
          totalEarnings: `₹${totalEarnings.toFixed(0)}`,
          todayDeliveredOrders: todayDeliveredOrders.length,
          todayEarnings: `₹${todayEarnings.toFixed(0)}`
        },
        deliveredOrders: detailedOrders
      });
   
    } catch (err) {
      console.error("Error fetching delivery summary:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
   
   
   //✅ Get order details
  const getOrderDetails = async (req, res) => {
    try {
      const { id } = req.params;
   
      const order = await Order.findById(id)
        .populate("items.product") 
        .populate("user", "fullName phoneNumber") 
        .populate("items.product.seller", "name"); 
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      const product = order.items[0]?.product;
      const address = order.deliveryAddress || {}; 
   
      const sellerName = product?.seller?.name || "N/A"; 
   
      const orderDetails = {
        orderId: order.orderId,
        productName: product?.productName || "N/A",
        image: product?.image || null,
        totalAmount: `₹${order.totalAmount}`,
        deliveryAddress: {
          name: address?.name || "N/A",
          street: address?.street || "N/A",
          city: address?.city || "N/A",
          zipcode: address?.zipCode || "N/A"
        },
        buyer: {
          name: order.user?.fullName || "N/A", 
          contact: order.user?.phoneNumber || "N/A"
        },
        seller: sellerName, 
        date: order.updatedAt.toLocaleDateString(),
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`
      };
   
      return res.status(200).json(orderDetails);
   
    } catch (err) {
      console.error("Error getting order details:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
   

  // ✅ Get date-wise order history for delivery boy
  const getDateWiseOrderHistory = async (req, res) => {
    try {
      const deliveryBoyId = req.deliveryBoy.id;
   
      const { from, to } = req.query;
   
      const startDate = from ? new Date(from) : new Date('2000-01-01');
      startDate.setHours(0, 0, 0, 0);
   
      const endDate = to ? new Date(to) : new Date();
      endDate.setHours(23, 59, 59, 999);
   
      // 1. Fetch delivered orders for the authenticated delivery boy within the specified date range
      const deliveredOrders = await Order.find({
        deliveryBoy: deliveryBoyId,
        deliveryStatus: "Delivered",
        updatedAt: { $gte: startDate, $lte: endDate }
      })
        .populate("user", "name")
        .populate("items.product", "image")
        .sort({ updatedAt: -1 });
   
      // 2. Initialize counters
      let totalEarnings = 0;
      let totalDelivered = 0;
      const dateWiseOrders = {};
   
      // 3. Group orders by date
      deliveredOrders.forEach(order => {
        const deliveryDate = new Date(order.updatedAt);
        const dateKey = deliveryDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit'
        });
   
        const earning = order.totalAmount * 0.10; 
        totalEarnings += earning;
        totalDelivered++;
   
        const orderCard = {
          id:order.id,
          orderId: order.orderId,
          deliveredOn: `Delivered on ${dateKey}`,
          customerName: order.user?.name || "Customer",
          productImage: order.items[0]?.product?.image || null,
          yourEarning: `₹${earning.toFixed(0)}`
        };
   
        if (!dateWiseOrders[dateKey]) {
          dateWiseOrders[dateKey] = [];
        }
   
        dateWiseOrders[dateKey].push(orderCard);
      });
   
      // 4. Format response to match UI
      const orderHistory = Object.entries(dateWiseOrders).map(([date, orders]) => ({
        date,
        orders
      }));
   
      return res.status(200).json({
        totalDelivered,
        totalEarning: `₹${totalEarnings.toFixed(0)}`,
        orderHistory
      });
    } catch (error) {
      console.error("Error fetching order history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
   
   
   // ✅ Get order history details
  const getOrderHistoryDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const deliveryBoyId = req.deliveryBoy._id; 
   
      const order = await Order.findOne({
        _id: id,
        deliveryBoy: deliveryBoyId,
        deliveryStatus: { $in: ["Accepted", "Delivered"] }
      })
        .populate("user", "fullName") 
        .populate("items.product", "productName image seller") 
        .populate("items.product.seller", "fullName");
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      const formatDateTime = (date) => {
        const options = {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
        return new Date(date).toLocaleString("en-US", options).replace(",", " at");
      };
   
      const confirmedDate = formatDateTime(order.createdAt);
      const deliveredDate = formatDateTime(order.updatedAt);
   
      const sellerName = order.items[0]?.product?.seller?.fullName || "Unknown Seller";
      const buyerName = order.user?.fullName || "Customer";
   
      const response = {
        orderId: order.orderId,
        productName: `${order.items[0]?.product?.productName || "Product"}${order.items[0]?.quantity ? `, Pack of ${order.items[0].quantity}` : ""}`,
        productImage: order.items[0]?.product?.image || null,
        buyerName: buyerName,
        sellerName: sellerName,
        totalAmount: `₹${order.totalAmount}`,
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
        timeline: [
          { label: "Order Confirmed", date: confirmedDate },
          { label: "Delivered On", date: deliveredDate }
        ]
      };
   
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching order detail:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
   
 module.exports = {
    acceptOrder,
    canceldeliveryBoyOrder,
    getAvailableOrders,
    getavaliableOrderDetails,
    confirmPayment,
    verifyOnlinePayment,
    getDeliveryBoySummary,
    getOrderDetails,
    getDateWiseOrderHistory,
    getOrderHistoryDetails,
    registerdeliveryBoy,
    LoginDeliveryBoy
  };  
 
 