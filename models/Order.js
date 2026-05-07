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

    // ✅ OPTIONAL FOR WALK-IN CUSTOMERS
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    customerPhone: {
      type: String,
      required: false
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

/* ================= SMARTBIZ EXTENSIONS ================= */

OrderSchema.add({
  paymentMethod: {
    type: String,
    enum: ["CASH", "WALLET", "MPESA"],
    default: "CASH"
  }
});

OrderSchema.add({
  source: {
    type: String,
    enum: ["WHATSAPP", "MANUAL"],
    default: "WHATSAPP"
  }
});

module.exports = mongoose.model("Order", OrderSchema);
