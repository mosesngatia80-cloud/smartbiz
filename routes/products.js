const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");

/*
  PUBLIC: Get all products (DEV MODE)
*/
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Load products error:", err.message);
    res.status(500).json({ message: "Failed to load products" });
  }
});

/*
  🔐 PROTECTED: Create product
*/
router.post("/", auth, async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!req.user.business) {
      return res.status(400).json({ message: "No business context" });
    }

    const product = await Product.create({
      name,
      price,
      owner: req.user._id,
      business: req.user.business
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
