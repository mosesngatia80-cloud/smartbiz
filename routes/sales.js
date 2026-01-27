const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const {
  createSale,
  getSales,
  getDailySummary,
  getMonthlySummary
} = require("../controllers/saleController");

// Create a sale
router.post("/", auth, createSale);

// Get all sales for logged-in business
router.get("/", auth, getSales);

// Dashboard daily summary
router.get("/summary", auth, getDailySummary);

// Monthly summary
router.get("/summary/monthly", auth, getMonthlySummary);

module.exports = router;
