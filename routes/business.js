const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * CREATE OR RETURN BUSINESS
 * Ensures business always has a wallet
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Business name required" });
    }

    // 1️⃣ Check if business already exists for this owner
    let business = await Business.findOne({ owner: req.user._id });

    if (!business) {
      // Create business
      business = await Business.create({
        name,
        category,
        owner: req.user._id
      });
    }

    // 2️⃣ Ensure business has a wallet
    if (!business.walletId) {
      const wallet = await Wallet.create({
        owner: business._id,
        ownerType: "BUSINESS",
        balance: 0,
        currency: "KES"
      });

      business.walletId = wallet._id;
      await business.save();
    }

    return res.status(200).json({
      message: "Business ready",
      business
    });
  } catch (err) {
    console.error("❌ Business setup error:", err.message);
    return res.status(500).json({
      message: "Failed to setup business",
      error: err.message
    });
  }
});

module.exports = router;
