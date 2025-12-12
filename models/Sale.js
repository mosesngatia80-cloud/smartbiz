const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "wallet"],
      default: "cash",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);
