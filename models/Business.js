const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    name: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", BusinessSchema);
