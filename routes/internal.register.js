const express = require("express");
const router = express.Router();

const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * 🔐 INTERNAL AUTH MIDDLEWARE
 * Backward-compatible: supports existing env keys
 */
function internalAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing internal token" });
  }

  const token = auth.split(" ")[1];

  const expected =
    process.env.SMARTCONNECT_SECRET ||
    process.env.SMARTCONNECT_INTERNAL_KEY ||
    process.env.CT_INTERNAL_KEY;

  if (!expected || token !== expected) {
    return res.status(403).json({ message: "Invalid internal token" });
  }

  next();
}

/**
 * 🏢 INTERNAL REGISTER BUSINESS + WALLET
 * POST /api/internal/register
 */
router.post("/register", internalAuth, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const existingBusiness = await Business.findOne({ phone });
    if (existingBusiness) {
      return res.json({ alreadyExists: true });
    }

    const business = await Business.create({
      phone,
      status: "ACTIVE",
      tier: "NEW"
    });

    await Wallet.create({
      owner: business._id,
      ownerType: "BUSINESS",
      balance: 0,
      currency: "KES"
    });

    return res.json({ walletCreated: true });

  } catch (err) {
    console.error("❌ INTERNAL REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
