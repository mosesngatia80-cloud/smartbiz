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
    const { name, category, phone, whatsappNumber } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Business name and phone required"
      });
    }

    const userId = req.user.user;

    // 1️⃣ Find or create business
    let business = await Business.findOne({ owner: userId });

    if (!business) {
      business = await Business.create({
        name,
        category,
        phone,
        whatsappNumber: whatsappNumber || phone, // default link
        owner: userId
      });
    } else {
      // 🔗 Allow linking / updating WhatsApp later
      if (whatsappNumber && business.whatsappNumber !== whatsappNumber) {
        business.whatsappNumber = whatsappNumber;
        await business.save();
      }
    }

    // 2️⃣ Find or create wallet
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

    // 3️⃣ Link wallet
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
 * GET MY BUSINESS
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
    res.status(500).json({ message: "Failed to fetch business" });
  }
});

module.exports = router;
