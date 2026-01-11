const express = require("express");
const router = express.Router();

const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/* =========================
   INTERNAL AUTH
========================= */
function internalAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || auth !== `Bearer ${process.env.SMARTCONNECT_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
}

/* =========================
   REGISTER BUSINESS + WALLET
   POST /api/internal/register
========================= */
router.post("/register", internalAuth, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    // 1. Check existing business
    const existing = await Business.findOne({ phone });
    if (existing) {
      return res.json({ alreadyExists: true });
    }

    // 2. Create business
    const business = await Business.create({
      phone,
      status: "ACTIVE",
      tier: "NEW"
    });

    // 3. Create wallet
    await Wallet.create({
      owner: business._id,
      ownerType: "BUSINESS",
      balance: 0,
      currency: "KES",
      limits: {
        dailyWithdrawLimit: 5000,
        perTxWithdrawLimit: 2000,
        instantWithdrawEnabled: true
      }
    });

    return res.json({ walletCreated: true });

  } catch (err) {
    console.error("❌ INTERNAL REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
