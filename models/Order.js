const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    businessWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true
    },

    // ✅ REQUIRED FOR REFUNDS & AUDIT
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerPhone: {
      type: String,
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        name: String,
        price: Number,
        qty: Number,
        lineTotal: Number
      }
    ],

    total: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID"
    },

    paymentRef: String,
    paidAt: Date,
    refundedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);

// ================= SMARTBIZ EXTENSIONS =================

// Payment method (Cash / Wallet / MPESA)
OrderSchema.add({
  paymentMethod: {
    type: String,
    enum: ["CASH", "WALLET", "MPESA"],
    default: "CASH"
  }
});

// Source of order (WhatsApp or Manual)
OrderSchema.add({
  source: {
    type: String,
    enum: ["WHATSAPP", "MANUAL"],
    default: "WHATSAPP"
  }
});

