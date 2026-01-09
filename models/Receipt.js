const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },

    // ✅ MADE OPTIONAL (GO-LIVE SAFE)
    customerPhone: {
      type: String,
      default: null
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "KES"
    },

    paymentMethod: {
      type: String,
      default: "M-PESA"
    },

    status: {
      type: String,
      enum: ["ISSUED", "REFUNDED"],
      default: "ISSUED"
    },

    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Receipt", receiptSchema);
