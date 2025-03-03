const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  
  
  phone: { type: String, required: function() { return this.role !== "admin"; } },
  address: { type: String, required: function() { return this.role !== "admin"; } },
  
  role: { type: String, enum: ["client", "provider", "admin"], required: true },
  verificationStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },

  servicesOffered: [{ type: String }],
  experience: { type: Number, default: 0 }, 
  documents: { type: Number }, 
  availability: { type: Boolean, default: true }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

