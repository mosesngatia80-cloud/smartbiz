const express = require("express");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const router = express.Router();

/**
 * 🧪 DEBUG PING (DEPLOYMENT CHECK)
 * GET /api/internal/__ping
 */
router.get("/__ping", (req, res) => {
  res.json({
    ok: true,
    service: "navu-smart-biz",
    route: "internal.wallet",
    time: new Date().toISOString()
  });
});

/**
 * 🔐 INTERNAL AUTH MIDDLEWARE
 */
function internalAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing internal token" });
  }

  const token = auth.split(" ")[1];

  if (token !== process.env.SMARTCONNECT_SECRET) {
    return res.status(403).json({ message: "Invalid internal token" });
  }

  next();
}

/**
 * 💼 INTERNAL: GET USER WALLET BALANCE BY PHONE
 * GET /api/internal/wallet/balance?phone=2547xxxx
 */
router.get("/wallet/balance", internalAuth, async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wallet = await Wallet.findOne({
      owner: user._id,
      ownerType: "USER"
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({
      walletId: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency
    });

  } catch (err) {
    console.error("❌ Internal wallet balance error:", err.message);
    res.status(500).json({ message: "Failed to fetch wallet balance" });
  }
});

module.exports = router;
