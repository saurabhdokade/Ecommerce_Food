const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { confirmOrder, cancelOrder, getUserOrders, getViewOrderDetails, getOrderById,  trackOrder } = require("../controllers/orderController");


//✅ User Order Routes
router.get("/details/:orderId", isAuthenticatedUser, getOrderById);
router.get("/orders", isAuthenticatedUser, getUserOrders);
router.get("/viewOrder/:orderId", isAuthenticatedUser, getViewOrderDetails);

//✅ User Order Status
router.put("/confirm/:orderId", isAuthenticatedUser, confirmOrder);
router.put("/cancel/:orderId", isAuthenticatedUser, cancelOrder);


//✅ Tracker
router.get("/track/:id", trackOrder);


module.exports = router;
