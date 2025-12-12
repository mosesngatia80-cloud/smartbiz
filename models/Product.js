const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
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
  category: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);
