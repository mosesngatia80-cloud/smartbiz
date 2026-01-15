const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // 📞 Explicit business contact (WhatsApp-capable)
    phone: { type: String, required: true, index: true },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },

    // 🔗 Derived public vendor link
    whatsappLink: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", BusinessSchema);
