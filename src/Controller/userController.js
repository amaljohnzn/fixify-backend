const User = require("../Models/userModel");
const Service =require("../Models/serviceModel")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

//  Register a new client
const registerClient = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
    role: "client",
  });

  res.status(201).json({
    message: "client registered",
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

//  Register a new service provider
const registerProvider = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, servicesOffered, experience, documents } = req.body;

  if (!Array.isArray(servicesOffered) || servicesOffered.length === 0) {
    return res.status(400).json({ message: "Services offered must be a non-empty array" });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const normalizedServices = servicesOffered.map(service => service.trim().toLowerCase());

  const serviceRegexArray = normalizedServices.map(service => new RegExp(`^${service}$`, "i"));

  const matchedServices = await Service.find({
    name: { $in: serviceRegexArray }
  }).select("name");

  if (!matchedServices || matchedServices.length !== normalizedServices.length) {
    return res.status(400).json({ message: "Some services do not exist. Please check service names." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
    role: "provider",
    servicesOffered: matchedServices.map(service => service.name), 
    experience,
    documents: documents || [], 
    verificationStatus: "Pending",
  });

  if (!user) {
    return res.status(500).json({ message: "User registration failed" });
  }

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    servicesOffered: user.servicesOffered,
  });
});



//  Register an admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus,
  });
});

//  Login user (Client, Provider, or Admin)
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,  
      secure: process.env.NODE_ENV === "production",  
      sameSite: "Strict",  
      maxAge: 30 * 24 * 60 * 60 * 1000, 
    });

    res.json({
      message: "Login successful",
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

//  Logout user
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), 
  });

  res.status(200).json({ message: "Logged out successfully" });
});

//  Get user profile (Client, Provider, or Admin)
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update user profile (Client, Provider, or Admin)
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = {
  registerClient,
  registerProvider,
  registerAdmin,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
