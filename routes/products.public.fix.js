
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Business = require("../models/Business");

/*
 🔓 PUBLIC: Create product (FIXED)
*/
router.post("/public/create", async (req, res) => {
  try {
    const { name, price, stock = 0 } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ Get any existing business (MVP)
    const business = await Business.findOne();

    if (!business) {
      return res.status(400).json({ message: "No business found" });
    }

    const product = await Product.create({
      name,
      price,
      stock,
      owner: business.owner,   // ✅ auto-fill
      business: business._id,  // ✅ auto-fill
      isActive: true
    });

    res.status(201).json({
      message: "Product created",
      product
    });

  } catch (err) {
    console.error("Public create error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

