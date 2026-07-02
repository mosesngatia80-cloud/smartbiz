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
      },

      saleType: {
        type: String,
        enum: [
          "CASH",
          "DEBT",
          "ORDER",
          "RETURN",
          "ADJUSTMENT"
        ],
        default: "CASH"
      },

      source: {
        type: String,
        enum: [
          "POS",
          "WHATSAPP",
          "STOREFRONT",
          "MANUAL"
        ],
        default: "POS"
      },

      customerName: {
        type: String,
        default: ""
      },

      customerPhone: {
        type: String,
        default: ""
      },

      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
      },

      debtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Debt",
        default: null
      },

      reference: {
        type: String,
        default: ""
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
