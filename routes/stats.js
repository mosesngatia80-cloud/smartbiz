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
