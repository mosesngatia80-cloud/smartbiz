const mongoose = require("mongoose");

const PaymentEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "MPESA",
      index: true,
    },

    checkoutRequestId: {
      type: String,
      index: true,
      sparse: true,
    },

    receipt: {
      type: String,
      index: true,
      sparse: true,
    },

    reference: {
      type: String, // orderId or invoiceId
      index: true,
    },

    amount: {
      type: Number,
    },

    phone: {
      type: String,
    },

    rawPayload: {
      type: Object,
      required: true,
    },

    processed: {
      type: Boolean,
      default: false,
      index: true,
    },

    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   BOUNDARY IDEMPOTENCY
   (Infrastructure-grade)
========================= */

// One successful receipt per provider
PaymentEventSchema.index(
  { provider: 1, receipt: 1 },
  { unique: true, sparse: true }
);

// One lifecycle per checkout request
PaymentEventSchema.index(
  { provider: 1, checkoutRequestId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("PaymentEvent", PaymentEventSchema);
