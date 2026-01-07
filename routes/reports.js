const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

/**
 * 📄 RECENT ORDERS
 */
router.get("/orders", auth, async (req, res) => {
  try {
    if (!req.user.business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const orders = await Order.find({ business: req.user.business })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(orders);
  } catch (err) {
    console.error("ORDERS report error:", err.message);
    res.status(500).json({ message: "Failed to load orders report" });
  }
});

/**
 * 📄 RECENT TRANSACTIONS
 */
router.get("/transactions", auth, async (req, res) => {
  try {
    const tx = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(tx);
  } catch (err) {
    console.error("TX report error:", err.message);
    res.status(500).json({ message: "Failed to load transactions report" });
  }
});

module.exports = router;
