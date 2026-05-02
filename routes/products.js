const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Business = require("../models/Business");

/*
 🔓 PUBLIC: Create product (FINAL FIX)
*/
router.post("/public/create", async (req, res) => {
  try {
    const { name, price, stock = 0 } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const business = await Business.findOne();

    if (!business) {
      return res.status(400).json({ message: "No business found" });
    }

    const product = await Product.create({
      name,
      price,
      stock,
      owner: business.owner,
      business: business._id,
      isActive: true
    });

    res.json({
      message: "Product created",
      product
    });

  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ message: err.message });
  }
});

/*
 🔓 PUBLIC: Get all products
*/
router.get("/public/all", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
