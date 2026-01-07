const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const Product = require("../models/Product");

/**
 * 📦 CREATE PRODUCT
 */
router.post("/", auth, async (req, res) => {
  try {
    const { business, name, price, stock, category } = req.body;

    if (!business || !name || !price) {
      return res.status(400).json({
        message: "Business, name and price are required"
      });
    }

    const product = await Product.create({
      owner: req.user.id,
      business,
      name,
      price,
      stock,
      category
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ message: "Failed to create product" });
  }
});

/**
 * 📦 GET MY PRODUCTS
 */
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.id });
    res.json(products);
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

module.exports = router;
