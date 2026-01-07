const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", BusinessSchema);
