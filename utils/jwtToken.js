const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRE } = process.env; // Ensure you're correctly using process.env for environment variables

const sendToken = (user, statusCode, res) => {
    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "HFFNSJGKFDAUGJDGDNBJ444GDGGhbhFGDU", { expiresIn: process.env.JWT_EXPIRE || "5d" });

    // Options for cookie
    const options = {
        expires: new Date(Date.now() + parseInt(process.env.JWT_EXPIRE || "5d") * 24 * 60 * 60 * 1000), // Ensure JWT_EXPIRE is converted to a number
        httpOnly: true,
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        token,
        user,
    });
};

module.exports = sendToken;
