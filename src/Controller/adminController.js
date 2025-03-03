const asyncHandler = require("express-async-handler");
const User = require("../Models/userModel");
const ServiceRequest = require("../Models/serviceRequest");
const ProviderEarnings = require("../Models/providerEarnings");


//  Get all service providers
const getAllProviders = asyncHandler(async (req, res) => {
  const providers = await User.find({ role: "provider" }).select("-password");
  res.json(providers);
});

//  Approve or Reject provider verification
const verifyProvider = asyncHandler(async (req, res) => {
  const { providerId, status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status. Must be 'Approved' or 'Rejected'.");
  }

  const provider = await User.findById(providerId);
  if (!provider || provider.role !== "provider") {
    res.status(404);
    throw new Error("Provider not found.");
  }

  provider.verificationStatus = status;
  await provider.save();

  res.json({ message: `Provider verification updated to ${status}` });
});


//  Get all service bookings 
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await ServiceRequest.find().populate("provider", "name phone").populate("client", "name");
  res.json(bookings);
});

//  Get only pending service requests
const getPendingBookings = asyncHandler(async (req, res) => {
  const pendingBookings = await ServiceRequest.find({ status: "Pending" })
    .populate("provider", "name phone")
    .populate("client", "name");

  res.json(pendingBookings);
});

//admin earnins
const getAdminEarnings = asyncHandler(async (req, res) => {
  const earnings = await ProviderEarnings.find();

  let totalRevenue = 0;
  let totalCommission = 0;
  let earningsBreakdown = {};

  earnings.forEach(entry => {
    totalRevenue += entry.totalAmount;
    totalCommission += entry.commission;

    if (!earningsBreakdown[entry.serviceName]) {
      earningsBreakdown[entry.serviceName] = {
        totalAmount: 0,
        commission: 0,
        providerEarnings: 0
      };
    }

    earningsBreakdown[entry.serviceName].totalAmount += entry.totalAmount;
    earningsBreakdown[entry.serviceName].commission += entry.commission;
    earningsBreakdown[entry.serviceName].providerEarnings += entry.providerEarnings;
  });

  const formattedEarningsBreakdown = Object.keys(earningsBreakdown).map(service => ({
    serviceName: service,
    totalAmount: earningsBreakdown[service].totalAmount,
    commission: earningsBreakdown[service].commission,
    providerEarnings: earningsBreakdown[service].providerEarnings
  }));

  res.json({
    totalRevenue,
    totalCommission,
    earningsBreakdown: formattedEarningsBreakdown
  });
});


module.exports = { getAllProviders, verifyProvider, getAllBookings, getPendingBookings, getAdminEarnings };
