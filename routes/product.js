const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");
const verifyToken = require("../middleware/authMiddleware").default;

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

/*
 🔓 PUBLIC: Create product (MVP TEST ONLY - NO AUTH)
*/
router.post("/public/create", async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 👉 Use first available business (MVP mode)
    const business = await Business.findOne();
    if (!business) {
      return res.status(400).json({ message: "No business found in system" });
    }

    const product = new Product({
      owner: business.owner,
      business: business._id,
      name,
      category,
      price,
      stock,
      description
    });

    await product.save();

    res.json({
      message: "Product created (public)",
      product
    });

  } catch (err) {
    console.error("Public create error:", err);
    res.status(500).json({ error: err.message });
  }
});

/*
 🔓 PUBLIC: Get all products (MVP TEST ONLY)
*/
router.get("/public/all", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Public products error:", err.message);
    res.status(500).json({ message: "Failed to load products" });
  }
});

module.exports = router;
