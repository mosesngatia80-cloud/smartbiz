const mongoose = require("mongoose");

const SubscriptionSchema =
  new mongoose.Schema(
    {
      business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
      },

      plan: {
        type: String,
        enum: [
          "STARTER",
          "BUSINESS",
          "PREMIUM"
        ],
        default: "BUSINESS"
      },

      amount: {
        type: Number,
        required: true
      },

      status: {
        type: String,
        enum: [
          "ACTIVE",
          "EXPIRED",
          "PENDING"
        ],
        default: "PENDING"
      },

      startDate: Date,

      expiryDate: Date,

      graceUntil: Date,

      lastReminderSent: Date,

      autoRenew: {
        type: Boolean,
        default: false
      },

      paymentReference: String
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "Subscription",
    SubscriptionSchema
  );
