const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
const asyncHandler = require("express-async-handler");
const cookieParser = require("cookie-parser");

// Protect route middleware (Authenticate user)
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.token; 

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); 
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, invalid or expired token");
  }
});
//admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied, admin only");
  }
};
//provider middleware
const provider = (req, res, next) => {
  if (req.user && req.user.role === "provider" && req.user.verificationStatus === "Approved") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied, only approved providers can proceed");
  }
};


module.exports = { protect, admin, provider };
