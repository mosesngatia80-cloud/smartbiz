const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const auth = require("../middleware/auth");

// =====================
// CREATE BUSINESS
// =====================
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Business name is required" });
    }

    // Check if business already exists for this user
    const existing = await Business.findOne({ owner: req.user.id });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Business already exists" });
    }

    // Create business
    const business = await Business.create({
      name,
      owner: req.user.id,
    });

    // Link business to user
    await User.findByIdAndUpdate(req.user.id, {
      business: business._id,
    });

    // 🔥 AUTO-CREATE BUSINESS WALLET
    const walletExists = await Wallet.findOne({
      owner: business._id.toString(),
    });

    if (!walletExists) {
      await Wallet.create({
        owner: business._id.toString(),
        type: "BUSINESS",
        balance: 0,
      });
    }

    res.status(201).json({
      message: "Business created",
      business,
    });
  } catch (err) {
    console.error("CREATE BUSINESS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================
// GET MY BUSINESS
// =====================
router.get("/me", auth, async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.user.id });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(business);
  } catch (err) {
    console.error("GET BUSINESS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
