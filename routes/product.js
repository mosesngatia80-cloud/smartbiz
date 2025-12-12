const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");
const verifyToken = require("../middleware/auth");

// CREATE PRODUCT
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;

    const business = await Business.findOne({ owner: req.user._id });
    if (!business) return res.status(404).json({ message: "No business found." });

    const product = new Product({
      owner: req.user._id,
      business: business._id,
      name,
      category,
      price,
      stock,
      description
    });

    await product.save();
    res.json({ message: "Product created", product });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL PRODUCTS FOR THIS BUSINESS
router.get("/", verifyToken, async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    const products = await Product.find({ business: business._id });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE A PRODUCT
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated", product });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PRODUCT
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
