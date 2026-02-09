const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Business = require("../models/Business");
const auth = require("../middleware/auth");

/*
  🔐 PROTECTED: Get products for logged-in business ONLY
*/
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const products = await Product.find({
      business: business._id
    }).sort({ createdAt: -1 });

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

    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

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

/*
  🔐 PROTECTED: Update product (price, stock, name)
*/
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const userId = req.user.user;

    const product = await Product.findOne({
      _id: req.params.id,
      owner: userId
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: err.message });
  }
});

/*
  🔐 PROTECTED: Reduce stock after sale
*/
router.post("/:id/sell", auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const userId = req.user.user;

    const product = await Product.findOne({
      _id: req.params.id,
      owner: userId
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.stock -= quantity;
    await product.save();

    res.json({
      message: "Sale recorded",
      productId: product._id,
      remainingStock: product.stock
    });
  } catch (err) {
    console.error("Sell product error:", err);
    res.status(500).json({ message: err.message });
  }
});

/*
  🔐 PROTECTED: Delete product
*/
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      owner: userId
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
