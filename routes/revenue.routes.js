const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/authMiddleware").default;

/**
 * GET REVENUE SUMMARY
 */
router.get("/summary", auth, async (req, res) => {
  try {
    const orders = await Order.find({
      paymentStatus: "PAID"
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenue = orders
      .filter(o => o.paidAt && o.paidAt >= today)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthRevenue = orders
      .filter(o => o.paidAt && o.paidAt >= monthStart)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      today: todayRevenue,
      month: monthRevenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
