const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    unique: false
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Customer", customerSchema);
