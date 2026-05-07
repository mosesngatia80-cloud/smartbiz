const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
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
