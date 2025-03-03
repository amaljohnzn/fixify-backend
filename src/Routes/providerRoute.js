const express = require("express");
const router = express.Router();
const { protect, provider } = require("../middleware/authmiddleware");
const { getProviderEarnings, withdrawEarnings } = require("../Controller/providerEarningsController");

// Provider views earnings 
router.get("/earnings", protect, provider, getProviderEarnings);

// Provider withdraws earnings
router.post("/withdraw", protect, provider, withdrawEarnings);

module.exports = router;
