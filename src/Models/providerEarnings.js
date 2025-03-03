const mongoose = require("mongoose");

const ProviderEarningsSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", required: true },
  serviceName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  providerEarnings: { type: Number, required: true },
  balance: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ProviderEarnings", ProviderEarningsSchema);
