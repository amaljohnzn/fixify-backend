const asyncHandler = require("express-async-handler");
const ServiceRequest = require("../Models/serviceRequest");
const User = require("../Models/serviceModel");
const ProviderEarnings = require("../Models/providerEarnings");

// Create a new service request
const createServiceRequest = asyncHandler(async (req, res) => {
    const { serviceName, location, phone } = req.body;

    if (!serviceName || !location || !phone) {
        res.status(400);
        throw new Error("All fields are required");
    }

    const newRequest = await ServiceRequest.create({
        serviceName,
        location,
        phone,
        client: req.user._id,
        status: "Pending",
    });

    res.status(201).json({
        _id: newRequest._id,
        serviceName: newRequest.serviceName,
        status: newRequest.status,
        provider: newRequest.provider,
        location: newRequest.location,
        phone: newRequest.phone,
        paymentStatus: newRequest.paymentStatus,
        createdAt: newRequest.createdAt,
    });
});

//Get all pending service requests (For providers)
const getPendingRequests = asyncHandler(async (req, res) => {
    const pendingRequests = await ServiceRequest.find({
        status: "Pending",
        provider: null,
        serviceName: { $in: req.user.servicesOffered },
    })
        .populate("client", "name phone location")
        .sort({ createdAt: -1 });

    const formattedRequests = pendingRequests.map(request => ({
        _id: request._id,
        client: request.client
            ? {
                _id: request.client._id,
                name: request.client.name,
                phone: request.client.phone,
                location: request.client.location
            }
            : null,
        serviceName: request.serviceName,
        status: request.status,
        createdAt: request.createdAt,
    }));

    res.json(formattedRequests);
});


//  Accept a service request
const acceptServiceRequest = asyncHandler(async (req, res) => {
    const serviceRequest = await ServiceRequest.findById(req.params.id).populate("client", "name");

    if (!serviceRequest) {
        res.status(404);
        throw new Error("Service request not found");
    }

    if (serviceRequest.status !== "Pending") {
        res.status(400);
        throw new Error("Request is already accepted");
    }

    serviceRequest.status = "Accepted";
    serviceRequest.provider = req.user.id;
    await serviceRequest.save();

    res.json({
        message: "Request accepted",
        serviceRequest: {
            _id: serviceRequest._id,
            client: serviceRequest.client._id,
            clientName: serviceRequest.client.name,
            serviceName: serviceRequest.serviceName,
            status: serviceRequest.status,
            location: serviceRequest.location,
            paymentStatus: "Pending",
            createdAt: serviceRequest.createdAt,
        },
    });
});


// Get accepted requests for a provider
const getAcceptedRequests = asyncHandler(async (req, res) => {
    const requests = await ServiceRequest.find({
        provider: req.user.id,
        status: "Accepted"
    })
        .populate("client", "name phone location")
        .sort({ createdAt: -1 });

    const formattedRequests = requests.map(request => ({
        _id: request._id,
        client: request.client ? request.client._id : null,
        clientName: request.client ? request.client.name : null,
        serviceName: request.serviceName,
        status: request.status,
        location: request.location,
        paymentStatus: "Pending",
        createdAt: request.createdAt,
    }));

    res.json(formattedRequests);
});


//  Get client requests status
const getClientRequests = asyncHandler(async (req, res) => {
    const requests = await ServiceRequest.find({ client: req.user.id })
        .select("serviceName status provider")
        .populate("provider", "name phone"); // Populate only name & phone from provider

    res.json(requests);
});

// Mark service request as completed with charges
const completeServiceRequest = asyncHandler(async (req, res) => {
    const labourCharge = Number(req.body.labourCharge) || 0;
    const partsCharge = Number(req.body.partsCharge) || 0;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
        res.status(404);
        throw new Error("Service request not found");
    }

    if (serviceRequest.provider.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You can only complete your assigned requests");
    }

    if (serviceRequest.status !== "Accepted") {
        res.status(400);
        throw new Error("Request is not in an accepted state");
    }

    const totalAmount = labourCharge + partsCharge;

    serviceRequest.status = "Completed";
    serviceRequest.labourCharge = labourCharge;
    serviceRequest.partsCharge = partsCharge;
    serviceRequest.totalAmount = totalAmount;

    await serviceRequest.save();
    res.json({ message: "Work marked as completed", serviceRequest });
});

//  View bill 
const viewBill = asyncHandler(async (req, res) => {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
        .populate("provider", "name phone");

    if (!serviceRequest) {
        res.status(404);
        throw new Error("Service request not found");
    }

    if (serviceRequest.client.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You can only view your own service bills");
    }

    if (serviceRequest.status !== "Completed") {
        res.status(400);
        throw new Error("This service is not yet completed");
    }

    res.json({
        serviceName: serviceRequest.serviceName,
        provider: serviceRequest.provider.name,
        providerPhone: serviceRequest.provider.phone,
        labourCharge: serviceRequest.labourCharge,
        partsCharge: serviceRequest.partsCharge,
        totalAmount: serviceRequest.totalAmount,
        paymentStatus: serviceRequest.paymentStatus
    });
});

// Make a payment 
const makePayment = asyncHandler(async (req, res) => {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
        res.status(404);
        throw new Error("Service request not found");
    }

    if (serviceRequest.status !== "Completed") {
        res.status(400);
        throw new Error("Service must be completed before payment");
    }

    if (serviceRequest.status === "Paid") {
        res.status(400);
        throw new Error("This service has already been paid for");
    }

    const commissionAmount = serviceRequest.totalAmount * 0.1;
    const providerEarningsAmount = serviceRequest.totalAmount * 0.9;

    serviceRequest.status = "Paid";
    serviceRequest.paymentStatus = "Paid";

    try {
        await serviceRequest.save();

        await ProviderEarnings.create({
            provider: serviceRequest.provider,
            serviceRequest: serviceRequest._id,
            serviceName: serviceRequest.serviceName,
            totalAmount: serviceRequest.totalAmount,
            providerEarnings: providerEarningsAmount,
            commission: commissionAmount,
            balance: providerEarningsAmount
        });

        res.json({ message: "Payment successful", serviceRequest });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "Failed to process payment", error });
    }
});


//  Submit a rating after payment
const submitRating = asyncHandler(async (req, res) => {
    const rating = Number(req.body.rating);

    if (rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
        res.status(404);
        throw new Error("Service request not found");
    }

    if (serviceRequest.client.toString() !== req.user.id) {
        res.status(403);
        throw new Error("You can only rate your own service requests");
    }

    if (serviceRequest.status !== "Paid") {
        res.status(400);
        throw new Error("You can only rate a service after payment is completed");
    }

    serviceRequest.rating = rating;
    await serviceRequest.save();

    res.json({ message: "Rating submitted successfully", serviceRequest });
});

module.exports = {
    createServiceRequest,
    getPendingRequests,
    acceptServiceRequest,
    getAcceptedRequests,
    getClientRequests,
    makePayment,
    viewBill,
    completeServiceRequest,
    submitRating
};
