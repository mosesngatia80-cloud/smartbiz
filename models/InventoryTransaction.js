const mongoose = require("mongoose");

const inventoryTransactionSchema =
  new mongoose.Schema(
    {
      business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
      },

      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },

      action: {
        type: String,
        enum: [
          "Added",
          "Sold",
          "Adjustment"
        ],
        required: true
      },

      quantity: {
        type: Number,
        required: true
      },

      buyingPrice: {
        type: Number,
        default: 0
      },

      sellingPrice: {
        type: Number,
        default: 0
      },

      profitPerUnit: {
        type: Number,
        default: 0
      },

      stockBefore: {
        type: Number,
        required: true
      },

      stockAfter: {
        type: Number,
        required: true
      }

    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "InventoryTransaction",
    inventoryTransactionSchema
  );
