const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(

  {
    name: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: true
    },

    duration: {
      type: Number,
      default: 30
    },

    image: {
      type: String,
      default: ""
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    owner: {
      type: String,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.models.Service ||

mongoose.model(
  "Service",
  ServiceSchema
);
