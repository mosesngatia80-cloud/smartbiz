const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Low stock alert (stock <= 5)
router.get("/stock", async (req, res) => {
  try {
    const lowStock = await Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 });

    res.json({
      count: lowStock.length,
      products: lowStock
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Out of stock alert (stock == 0)
router.get("/out-of-stock", async (req, res) => {
  try {
    const outOfStock = await Product.find({ stock: 0 }).sort({ name: 1 });

    res.json({
      count: outOfStock.length,
      products: outOfStock
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
