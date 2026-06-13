const mongoose = require("mongoose");

const inventoryTransactionSchema =
  new mongoose.Schema(
    {
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
