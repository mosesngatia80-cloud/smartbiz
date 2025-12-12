const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const auth = require("../middleware/auth");

// Create a sale
router.post("/", auth, async (req, res) => {
  try {
    const { business, items, totalAmount, customer, paymentMethod } = req.body;

    if (!business || !items || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sale = new Sale({
      business,
      items,
      totalAmount,
      customer,
      paymentMethod,
    });

    await sale.save();

    res.json({
      message: "Sale recorded",
      sale,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales for logged-in business
router.get("/", auth, async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's revenue
router.get("/today/total", auth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const result = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.json({ total: result[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
