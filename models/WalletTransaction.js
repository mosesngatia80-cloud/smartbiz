const mongoose = require("mongoose");

const WalletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true
    },

    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    source: {
      type: String, // AI, WHATSAPP, POS
      required: true
    },

    reference: {
      type: String // orderId, paymentRef, etc
    },

    balanceAfter: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", WalletTransactionSchema);
