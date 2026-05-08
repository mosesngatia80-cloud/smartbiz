const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },

    /* 👤 CUSTOMER INFO */

    name: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    /* 💰 CUSTOMER ANALYTICS */

    totalSpent: {
      type: Number,
      default: 0
    },

    /* 📒 FUTURE CREDIT SYSTEM */

    debtBalance: {
      type: Number,
      default: 0
    }
  },

  { timestamps: true }
);

module.exports =
  mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
