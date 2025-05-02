const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const DeliveryBoy = require("../model/deliveryBoyModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies || req.headers;

  if (!token) {
    return next(new ErrorHander("Please login to access this resource", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodedData.id); // <-- This should attach user

  if (!req.user) {
    return next(new ErrorHander("User not found", 401));
  }

  next();
});


exports.isAuthenticatedDeliveryBoy = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHander("Please login as delivery boy to access this resource", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.deliveryBoy = await DeliveryBoy.findById(decodedData.id);

  if (!req.deliveryBoy) {
    return next(new ErrorHander("Delivery boy not found", 401));
  }

  next();
});

exports.authorizeRoles = (...roles) =>{

    return(req,res,next)=>{
       if(!roles.includes(req.user.role)){
       return next(new ErrorHander(
            `Role: ${req.user.role} is not allowed to access this resource`,
            403
          )
         )
       }
       
      next();
    }
}
