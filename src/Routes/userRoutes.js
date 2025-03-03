const express = require("express");
const { registerClient, registerProvider, registerAdmin, loginUser, getUserProfile, updateUserProfile,logoutUser } = require("../Controller/userController");
const { protect, admin, provider } = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/register/client", registerClient);
router.post("/register/provider", registerProvider);
router.post("/register/admin", registerAdmin);
router.post("/login", loginUser);
router.post("/logout", logoutUser);



// Protected Routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

module.exports = router;


