const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * ENSURE BUSINESS + WALLET
 * Idempotent & safe
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Business name required" });
    }

    // ✅ CORRECT USER ID FROM JWT
    const userId = req.user.user;

    // 1️⃣ Find or create business
    let business = await Business.findOne({ owner: userId });

    if (!business) {
      business = await Business.create({
        name,
        category,
        owner: userId
      });
    }

    // 2️⃣ Find or create wallet for this business
    let wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      wallet = await Wallet.create({
        owner: business._id,
        ownerType: "BUSINESS",
        balance: 0,
        currency: "KES"
      });
    }

    // 3️⃣ Ensure business points to wallet
    if (!business.walletId) {
      business.walletId = wallet._id;
      await business.save();
    }

    return res.status(200).json({
      message: "Business ready",
      business,
      wallet
    });
  } catch (err) {
    console.error("❌ Business setup error:", err);
    return res.status(500).json({
      message: "Failed to setup business",
      error: err.message
    });
  }
});

/**
 * 🔒 GET MY BUSINESS (READ-ONLY)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(business);
  } catch (err) {
    console.error("❌ Get business error:", err.message);
    res.status(500).json({ message: "Failed to fetch business" });
  }
});

module.exports = router;
