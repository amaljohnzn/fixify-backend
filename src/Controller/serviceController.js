const Service = require("../Models/serviceModel");
const asyncHandler = require("express-async-handler");

// Add a new service

const addService = asyncHandler(async (req, res) => {
    const { name, description, category, priceRange } = req.body;

    const existingService = await Service.findOne({ name });
    if (existingService) {
        res.status(400);
        throw new Error("Service already exists");
    }

    const service = await Service.create({ name, description, category, priceRange });
    res.status(201).json(service);
});

// Update  service

const updateService = asyncHandler(async (req, res) => {
    const { name } = req.params;

    let service = await Service.findOne({ name });

    if (!service) {
        res.status(404);
        throw new Error("Service not found");
    }


    service.name = req.body.name || service.name;
    service.description = req.body.description || service.description;
    service.category = req.body.category || service.category;
    service.priceRange = req.body.priceRange || service.priceRange;

    const updatedService = await service.save();
    res.json(updatedService);
});

// Get all services

const getServices = asyncHandler(async (req, res) => {
    const services = await Service.find();
    res.json(services);
});

//  Delete a service

const deleteService = asyncHandler(async (req, res) => {
    const { name } = req.params;

    const service = await Service.findOne({ name });

    if (!service) {
        res.status(404);
        throw new Error("Service not found");
    }

    await service.deleteOne();
    res.json({ message: `Service '${name}' removed successfully` });
});

module.exports = { addService, updateService, getServices, deleteService };
