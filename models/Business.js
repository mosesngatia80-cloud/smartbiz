const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    /* ✅ MAIN PHONE */
    phone: {
      type: String,
      default: ""
    },

    /* ✅ WHATSAPP LOGIN */
    whatsappNumber: {
      type: String,
      trim: true,
      index: true
    },

    /* ✅ TEMP FLEXIBLE OWNER */
    owner: {
      type: String,
      default: ""
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet"
    },

    whatsappLink: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Business ||
  mongoose.model("Business", BusinessSchema);
