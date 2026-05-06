const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    /* NORMAL AUTH */
    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
    },

    /* SMARTBIZ AUTH */
    whatsapp: {
      type: String,
      sparse: true,
    },

    businessName: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
