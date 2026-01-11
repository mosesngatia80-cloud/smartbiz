const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * 🔐 INTERNAL AUTH MIDDLEWARE
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

    /* 1️⃣ Ensure User exists */
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone
      });
    }

    /* 2️⃣ Check if Business already exists for this user */
    const existingBusiness = await Business.findOne({ owner: user._id });
    if (existingBusiness) {
      return res.json({ alreadyExists: true });
    }

    /* 3️⃣ Create Wallet */
    const wallet = await Wallet.create({
      owner: user._id,
      ownerType: "BUSINESS"
    });

    /* 4️⃣ Create Business */
    const business = await Business.create({
      name: `Business ${phone}`,
      owner: user._id,
      walletId: wallet._id
    });

    return res.json({
      walletCreated: true,
      businessId: business._id
    });

  } catch (err) {
    console.error("❌ INTERNAL REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
