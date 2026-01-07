const express = require("express");
const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Business = require("../models/Business");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * 🔎 DEBUG ROUTE
 */
router.get("/__debug_wallet_routes", (req, res) => {
  res.json({
    ok: true,
    file: "routes/wallet.js",
    time: new Date().toISOString()
  });
});

/**
 * 🔒 GET MY WALLET BALANCE (SECURE)
 */
router.get("/balance", auth, async (req, res) => {
  try {
    // Find user's business
    const business = await Business.findOne({ owner: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Find business wallet
    const wallet = await Wallet.findOne({
      owner: business._id.toString(),
      type: "BUSINESS"
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({
      balance: wallet.balance
    });
  } catch (err) {
    console.error("❌ Wallet balance error:", err.message);
    res.status(500).json({ message: "Failed to fetch wallet balance" });
  }
});

/**
 * CREATE WALLET (LEGACY / ADMIN)
 */
router.post("/create", async (req, res) => {
  try {
    const { owner, type = "USER" } = req.body;

    if (!owner) {
      return res.status(400).json({ message: "Owner is required" });
    }

    let wallet = await Wallet.findOne({ owner });
    if (wallet) {
      return res.json({ message: "Wallet already exists", wallet });
    }

    wallet = await Wallet.create({ owner, type });
    res.json({ message: "Wallet created", wallet });
  } catch (err) {
    console.error("❌ Wallet create error:", err.message);
    res.status(500).json({ message: "Wallet creation failed" });
  }
});

/**
 * 💰 TOP UP WALLET (ADMIN / SYSTEM)
 */
router.post("/topup", async (req, res) => {
  try {
    const { owner, amount } = req.body;

    if (!owner || !amount || amount <= 0) {
      return res.status(400).json({ message: "Owner and valid amount required" });
    }

    const wallet = await Wallet.findOne({ owner });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.balance += Number(amount);
    await wallet.save();

    res.json({
      message: "Wallet topped up",
      balance: wallet.balance
    });
  } catch (err) {
    console.error("❌ Wallet topup error:", err.message);
    res.status(500).json({ message: "Wallet topup failed" });
  }
});

/**
 * GET WALLET BY OWNER (DEBUG ONLY)
 */
router.get("/:owner", async (req, res) => {
  const wallet = await Wallet.findOne({ owner: req.params.owner });
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });
  res.json(wallet);
});

module.exports = router;
