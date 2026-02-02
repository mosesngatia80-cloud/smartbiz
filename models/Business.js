const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true,
      index: true
    },

    // ✅ ADD THIS (DO NOT REMOVE ANYTHING ELSE)
    whatsappNumber: {
      type: String,
      trim: true,
      index: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet"
    },

    // 🔒 KEEP EXISTING FIELD (DO NOT DELETE)
    whatsappLink: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// 🔒 Prevent model overwrite / cache issues
module.exports =
  mongoose.models.Business ||
  mongoose.model("Business", BusinessSchema);
