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
    name: String,
    phone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
