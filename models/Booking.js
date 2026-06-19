const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(

  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    customerPhone: {
      type: String,
      required: true
    },

    bookingDate: {
      type: String,
      required: true
    },

    bookingTime: {
      type: String,
      required: true
    },

    notes: {
      type: String,
      default: ""
    },

    status: {
      type: String,

      enum: [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "COMPLETED"
      ],

      default: "PENDING"
    },

    paymentStatus: {
      type: String,

      enum: [
        "UNPAID",
        "PAID"
      ],

      default: "UNPAID"
    },

    servicePrice: {
      type: Number,
      default: 0
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.models.Booking ||

mongoose.model(
  "Booking",
  BookingSchema
);
