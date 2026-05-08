const mongoose = require("mongoose");

const DebtSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    customerPhone: {
      type: String,
      default: ""
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },

    balance: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "UNPAID",
        "PARTIAL",
        "PAID"
      ],
      default: "UNPAID"
    },

    note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Debt ||
  mongoose.model(
    "Debt",
    DebtSchema
  );
