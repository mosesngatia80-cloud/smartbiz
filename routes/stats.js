const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Order = require("../models/Order");

/*
  GET /api/stats (PROTECTED)
*/
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.countDocuments();
    const orders = await Order.countDocuments();

    res.json({
      products,
      orders
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats" });
  }
});

module.exports = router;

/**
 * 📊 TODAY'S SALES STATS (BUSINESS)
 * GET /api/stats/today
 */
router.get("/today", auth, async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const paidOrders = await Order.find({
      business: businessId,
      status: "PAID",
      paidAt: { $gte: start, $lte: end }
    });

    const totalSales = paidOrders.reduce(
      (sum, o) => sum + o.total,
      0
    );

    res.json({
      date: start.toISOString().slice(0, 10),
      orders: paidOrders.length,
      totalSales,
      currency: "KES"
    });
  } catch (err) {
    console.error("❌ Today stats error:", err.message);
    res.status(500).json({ message: "Failed to load today's stats" });
  }
});
