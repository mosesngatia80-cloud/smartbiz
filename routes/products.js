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
 🔍 PUBLIC: Find product by name (for WhatsApp)
*/
router.get("/search/by-name", async (req, res) => {
  try {
    const { name, businessId } = req.query;

    if (!name || !businessId) {
      return res.status(400).json({ message: "Missing name or businessId" });
    }

    const product = await Product.findOne({
      business: businessId,
      name: { $regex: name, $options: "i" },
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    console.error("Search product error:", err);
    res.status(500).json({ message: "Search failed" });
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

/*
 🔓 PUBLIC: Create product (MVP TEST ONLY)
*/
router.post("/public/create", async (req, res) => {
  try {
    const { name, price, stock = 0 } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const product = await Product.create({
      name,
      price,
      stock,
      isActive: true
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Public create error:", err);
    res.status(500).json({ message: err.message });
  }
});


/*
 🔓 PUBLIC: Create product (MVP FIXED WITH BUSINESS)
*/
router.post("/public/create", async (req, res) => {
  try {
    const { name, price, stock = 0 } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 👉 Get ANY existing business (temporary MVP logic)
    const Business = require("../models/Business");
    const business = await Business.findOne();

    if (!business) {
      return res.status(400).json({ message: "No business found in system" });
    }

    const product = await Product.create({
      name,
      price,
      stock,
      owner: business.owner,   // ✅ auto-fill
      business: business._id,  // ✅ auto-fill
      isActive: true
    });

    res.status(201).json(product);

  } catch (err) {
    console.error("Public create error:", err);
    res.status(500).json({ message: err.message });
  }
});

