const express = require("express");
const { addService, updateService, getServices, deleteService } = require("../Controller/serviceController");
const { protect, admin } = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", protect, admin, addService); 
// Add a new service

router.put("/:name", protect, admin, updateService); 
// Update a service

router.delete("/:name", protect, admin, deleteService); 
// Delete a service

// Public Route
router.get("/", getServices); // Get all services

module.exports = router;
