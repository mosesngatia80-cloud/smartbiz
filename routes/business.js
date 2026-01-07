const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * CREATE BUSINESS
 * Auto-create BUSINESS wallet
 */
router.post("/", auth, async (req, res) => {
  console.log("🔥 NEW BUSINESS ROUTE HIT"); // <-- DEBUG MARKER

  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Business name required" });
    }

    const business = await Business.create({
      name,
      category,
      owner: req.user._id
    });

    const wallet = await Wallet.create({
      owner: business._id,
      ownerType: "BUSINESS",
      balance: 0,
      currency: "KES"
    });

    business.walletId = wallet._id;
    await business.save();

    return res.status(201).json({
      message: "Business created",
      business
    });
  } catch (err) {
    console.error("❌ Business create error:", err.message);
    return res.status(500).json({
      message: "Failed to create business",
      error: err.message
    });
  }
});

module.exports = router;
