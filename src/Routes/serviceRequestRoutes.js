const express = require("express");
const router = express.Router();
const { protect, provider } = require("../middleware/authmiddleware"); // Use provider (not providerAuth)
const {
  createServiceRequest,
  getPendingRequests,
  acceptServiceRequest,
  getAcceptedRequests,
  getClientRequests,makePayment,viewBill,completeServiceRequest,submitRating
} = require("../Controller/serviceRequestController");

// Client creates a new service request
router.post("/", protect, createServiceRequest);

// Providers get all pending service requests
router.get("/pending", protect, provider, getPendingRequests);

// Provider accepts a service request
router.put("/:id/accept", protect, provider, acceptServiceRequest);

// Provider gets their accepted service requests
router.get("/accepted", protect, provider, getAcceptedRequests);

// satus check client
router.get("/myRequest", protect, getClientRequests)

// Provider marks as completed
router.put("/:id/complete", protect, provider, completeServiceRequest); 

// Client views bill
router.get("/:id/bill", protect, viewBill); 

// Client makes payment
router.put("/:id/pay", protect, makePayment); 

// Client submits a rating after payment
router.put("/:id/rate", protect, submitRating);


module.exports = router;
