const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * CREATE BUSINESS
 * Auto-creates a wallet
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Business name required" });
    }

    // 1️⃣ Create wallet
    const wallet = await Wallet.create({
      balance: 0,
      currency: "KES"
    });

    // 2️⃣ Create business with wallet attached
    const business = await Business.create({
      name,
      category,
      owner: req.user._id,
      walletId: wallet._id
    });

    res.status(201).json({
      message: "Business created",
      business
    });
  } catch (err) {
    console.error("Create business error:", err.message);
    res.status(500).json({ message: "Failed to create business" });
  }
});

module.exports = router;
