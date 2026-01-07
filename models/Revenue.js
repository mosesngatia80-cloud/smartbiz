const mongoose = require("mongoose");

const RevenueSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    grossAmount: { type: Number, required: true },
    fee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    channel: {
      type: String,
      enum: ["whatsapp", "mpesa", "wallet"],
      default: "wallet",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Revenue", RevenueSchema);
