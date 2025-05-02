const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { addToCart, removeFromCart, BuyOrderFromCart,getCartItemCount, incrementCartItem, decrementCartItem, saveForLater, moveToCart, removeItemFromCart, getCart } = require("../controllers/cartController");


//✅ User Cart Routes
router.post("/addtocart/:productId",isAuthenticatedUser,addToCart);
router.get('/cart/count', isAuthenticatedUser, getCartItemCount);
router.get("/getCarts", isAuthenticatedUser, getCart);

router.delete("/remove/:productId", isAuthenticatedUser, removeFromCart);
router.put("/increment/:productId", isAuthenticatedUser,incrementCartItem);
router.put("/decrement/:productId",isAuthenticatedUser, decrementCartItem);
router.post('/buyNow', isAuthenticatedUser, BuyOrderFromCart);
router.post("/saveForLater/:productId", isAuthenticatedUser, saveForLater);
router.post("/moveToCart/:productId", isAuthenticatedUser, moveToCart);


module.exports = router;
