const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");

/*
=====================================
 REVENUE SUMMARY
=====================================
 - Counts ONLY paid orders
 - Today revenue
 - Monthly revenue
*/
router.get("/summary", auth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      1
    );

    // 🔹 TODAY PAID ORDERS
    const todayOrders = await Order.find({
      business: req.user.business,
      status: "paid",
      createdAt: { $gte: todayStart },
    });

    // 🔹 MONTH PAID ORDERS
    const monthOrders = await Order.find({
      business: req.user.business,
      status: "paid",
      createdAt: { $gte: monthStart },
    });

    const today = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const month = monthOrders.reduce((sum, order) => sum + order.total, 0);

    res.json({ today, month });
  } catch (err) {
    console.error("Revenue summary error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
