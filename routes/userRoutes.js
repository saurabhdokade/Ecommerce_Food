const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUser,
  updateUserDetails,
  deleteUser,
  logout,
  googleLogin,
  facebookLogin,
  sendOTP,
  getUserDetails,

} = require("../controllers/userController");

const { isAuthenticatedUser } = require("../middlewares/auth");
const multer = require('multer');
const path = require('path');
const upload = require("../utils/multer");


const router = express.Router();
router.route("/signup").post(registerUser);
// router.route("/google").post(googleLogin)
router.route("/login").post(loginUser);
// Google Login
router.post("/google-login", googleLogin);

// Facebook Login
router.post("/facebook-login", facebookLogin);
router.route("/logout").get(logout);

router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/users").get(isAuthenticatedUser, getAllUser); // List all users
router.route('/users/:id').get(getUserDetails);
router.route("/users/:id").put(isAuthenticatedUser, upload.single("userProfile"),updateUserDetails) // Update user role
router.route("/users/:id").delete(isAuthenticatedUser, deleteUser); // Delete user

module.exports = router;