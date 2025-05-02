const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../model/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
// const twilio = require('twilio');
const { OAuth2Client } = require("google-auth-library"); // Import OAuth2Client
const clientt = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "772146215356-vofbc6i2a4i2jm6b05gsqc0joku37b1i.apps.googleusercontent.com");
require("dotenv").config();
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    address,
    userProfile,
  } = req.body;

  console.log("Registering user:", req.body);

  // Check for duplicate email
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: "User with this email already exists." });
  }

  // Check for duplicate phone
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ message: "User with this phone number already exists." });
  }

  // Create a new user
  const newUser = new User({
    name,
    email,
    phone,
    password,
    address: address || "",
    userProfile: userProfile || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
    status: "active",
  });

  await newUser.save();

  return res.status(201).json({
    success: true,
    message: "Account created successfully.",
  });
});



// Logout Agent
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.header("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHander("Please enter email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");


  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }
  sendToken(user, 200, res);
});

exports.googleLogin = catchAsyncErrors(async (req, res, next) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return next(new ErrorHander("Google token is required", 400));
  }

  const ticket = await clientt.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID, // Ensure this is set in .env
  });

  const { email, name, picture, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      avatar: picture,
    });
  }

  sendToken(user, 200, res);
});

exports.facebookLogin = catchAsyncErrors(async (req, res, next) => {
  const { accessToken, userID } = req.body;

  if (!accessToken || !userID) {
    return next(new ErrorHander("Facebook token is required", 400));
  }

  const url = `https://graph.facebook.com/v12.0/${userID}?fields=id,name,email,picture&access_token=${accessToken}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.email) {
    return next(new ErrorHander("Facebook login failed", 400));
  }

  let user = await User.findOne({ email: data.email });

  if (!user) {
    user = await User.create({
      name: data.name,
      email: data.email,
      facebookId: data.id,
      avatar: data.picture.data.url,
    });
  }

  sendToken(user, 200, res);
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorHander(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHander("Reset Password Token is invalid or has been expired", 400));
  }

  // Validate new password and confirm password
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Passwords do not match", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res); 
});

// Get all users (admin) with optional filtering
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, role, status } = req.query;

  // Build a dynamic filter object
  const filter = {};
  if (name) filter.name = { $regex: name, $options: 'i' }; 
  if (email) filter.email = { $regex: email, $options: 'i' }; 
  if (role) filter.role = role; 
  if (status) filter.status = status;

  const users = await User.find(filter);

  res.status(200).json({
    success: true,
    users: users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      registrationDate: user.registrationDate,
      activityLogs: user.activityLogs,
    })),
  });
});

// Get Single User Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      registrationDate: user.registrationDate,
      activityLogs: user.activityLogs,
    },
  });
});

// -------------------------- Update User Details (Admin Only) --------------------------
exports.updateUserDetails = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, locality } = req.body;

  // Find user by ID
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Update fields if provided in the request body
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (locality) user.locality = locality;


  if (req.file) {
    user.userProfile = req.file.path;
  }
  // Save the updated user
  await user.save();

  res.status(200).json({
    success: true,
    message: "User details updated successfully!",
    user,
  });
});

// -------------------------- Delete User (Admin Only) --------------------------
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully!",
  });
});


