const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    ownerType: {
      type: String,
      enum: ["USER", "BUSINESS"],
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "KES"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", WalletSchema);
