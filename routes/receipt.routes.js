const express = require("express");
const router = express.Router();

const {
  getReceiptByOrder,
  getReceiptsByCustomer
} = require("../controllers/receipt.controller.js");

// 🔍 Get receipt for an order
router.get("/order/:orderId", getReceiptByOrder);

// 👤 Get all receipts for a customer
router.get("/customer/:customerId", getReceiptsByCustomer);

module.exports = router;
