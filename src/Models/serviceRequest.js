const mongoose = require("mongoose");

const ServiceRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceName: { type: String, required: true }, 
  status: { type: String, enum: ["Pending", "Accepted","Completed", "Paid"], default: "Pending" },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  location: { type: String, required: true }, 
  phone: { type: String, required: true }, 
  

  labourCharge: { type: Number, default: 0 }, 
  partsCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  rating: { type: Number, min: 1, max: 5, default: null },

  createdAt: { type: Date, default: Date.now },
  providerEarnings: { type: Number, default: 0 }, 
  commission: { type: Number, default: 0 }

});

module.exports = mongoose.model("ServiceRequest", ServiceRequestSchema);
