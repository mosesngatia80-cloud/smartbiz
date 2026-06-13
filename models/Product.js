const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    salePrice: {
      type: Number,
      default: 0,
      min: 0
    },

    /* ✅ PRODUCT IMAGE */

    image: {
      type: String,
      default: ""
    },

    /* ✅ UNIT SYSTEM */

    unitType: {
      type: String,
      enum: [
        "PIECE",
        "KG",
        "GRAM",
        "LITRE",
        "ML"
      ],
      default: "PIECE"
    },

    allowFractions: {
      type: Boolean,
      default: false
    },

    pricePerUnit: {
      type: Number,
      default: 0
    },

    /* 📦 INVENTORY */

    stock: {
      type: Number,
      default: 0
    },

    /* 🔐 BUSINESS OWNER */

    business: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "Business",

      required: true
    },

    /* ✅ TEMP WHATSAPP OWNER */

    owner: {
      type: String,
      required: false
    },

    /* 🗑️ SOFT DELETE */

    isActive: {
      type: Boolean,
      default: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },

  { timestamps: true }
);

module.exports =
  mongoose.models.Product ||

  mongoose.model(
    "Product",
    ProductSchema
  );
