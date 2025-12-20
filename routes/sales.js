const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const { createSale, getSales, getDailySummary } = require("../controllers/saleController");

// Create a sale
router.post("/", auth, createSale);

// Get all sales for logged-in business
router.get("/", auth, getSales);

// Dashboard daily summary
router.get("/summary", auth, getDailySummary);

module.exports = router;

// Monthly summary
router.get("/summary/monthly", auth, require("../controllers/saleController").getMonthlySummary);
