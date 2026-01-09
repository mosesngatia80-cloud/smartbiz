const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Business = require("../models/Business");
const auth = require("../middleware/auth");

/*
  PUBLIC: Get all products
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
    const { name, price, currency = "KES", stock = 0 } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ USER ID FROM JWT
    const userId = req.user.user;

    // ✅ BUSINESS FROM DATABASE
    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    // ✅ INCLUDE REQUIRED owner FIELD
    const product = await Product.create({
      name,
      price,
      currency,
      stock,
      owner: userId,
      business: business._id
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
