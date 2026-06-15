const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    /* ✅ WHATSAPP-BASED OWNER */

    owner: {
      type: String,
      required: false,
      default: ""
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      default: "GENERAL"
    },

    note: {
      type: String,
      default: ""
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false
    },

    quantity: {
      type: Number,
      default: 0
    },

    supplier: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Expense ||
  mongoose.model(
    "Expense",
    ExpenseSchema
  );
