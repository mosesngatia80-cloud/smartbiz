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
      required: false
    },

    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    customerPhone: {
      type: String,
      required: false
    },

    customerName: {
      type: String,
      required: false
    },

    deliveryAddress: {
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

    /* =========================
       PAYMENT TRACKING
    ========================= */

    amountPaid: {
      type: Number,
      default: 0
    },

    balance: {
      type: Number,
      default: 0
    },

    paymentStatus: {
      type: String,

      enum: [
        "UNPAID",
        "PARTIAL",
        "PAID"
      ],

      default: "UNPAID"
    },

    /* =========================
       ORDER STATUS
    ========================= */

    status: {
      type: String,

      enum: [
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "DELIVERED",
        "UNPAID",
        "PAID",
        "REFUNDED",
        "REJECTED"
      ],

      default: "PENDING"
    },

    paymentRef: String,

    paidAt: Date,

    refundedAt: Date,

    /* =========================
       PAYMENT
    ========================= */

    paymentMethod: {
      type: String,

      enum: [
        "CASH",
        "WALLET",
        "MPESA"
      ],

      default: "CASH"
    },

    /* =========================
       ORDER SOURCE
    ========================= */

    source: {
      type: String,

      enum: [
        "WHATSAPP",
        "MANUAL",
        "STORE_FRONT"
      ],

      default: "WHATSAPP"
    }
  },

  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Order ||

  mongoose.model(
    "Order",
    OrderSchema
  );
