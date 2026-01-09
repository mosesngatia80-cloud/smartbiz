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
