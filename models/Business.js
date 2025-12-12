const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    category: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    tillNumber: { type: String },    // Safaricom Till
    storeNumber: { type: String },   // Store number if any
    operatorId: { type: String },    // e.g. MW
    metadata: { type: Object }       // any extra data
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", BusinessSchema);
