const express = require("express");
const router = express.Router();
const { acceptOrder, canceldeliveryBoyOrder, getAvailableOrders, confirmPayment, getDeliveryBoySummary, getOrderDetails, getDateWiseOrderHistory, getOrderHistoryDetails, getavaliableOrderDetails, verifyOnlinePayment, registerdeliveryBoy, LoginDeliveryBoy } = require("../controllers/deliveryBoyController");
const {isAuthenticatedDeliveryBoy} = require("../middlewares/auth");
 

//✅ Delivery Boy Order Routes
router.post("/signup/deliveryboy", registerdeliveryBoy);
router.post("/login/deliveryboy", LoginDeliveryBoy);
//✅deliveryboy page
router.patch('/accept/:id', isAuthenticatedDeliveryBoy, acceptOrder);
router.patch('/cancel/:id', isAuthenticatedDeliveryBoy, canceldeliveryBoyOrder);
 
 
//✅ deliveryboy summery payment 
router.get('/availableOrders', isAuthenticatedDeliveryBoy, getAvailableOrders);
router.get("/:id/details", isAuthenticatedDeliveryBoy, getavaliableOrderDetails);
router.post("/:id/payment", isAuthenticatedDeliveryBoy,confirmPayment);
router.get("/payment/verify", verifyOnlinePayment);
router.get("/deliveryboy/summary",  isAuthenticatedDeliveryBoy,getDeliveryBoySummary);
router.get("/details/:id", isAuthenticatedDeliveryBoy, getOrderDetails);
 
 
//✅ history
router.get("/order-history",isAuthenticatedDeliveryBoy,getDateWiseOrderHistory)
router.get('/order-history/:id', isAuthenticatedDeliveryBoy, getOrderHistoryDetails);
 

module.exports = router;