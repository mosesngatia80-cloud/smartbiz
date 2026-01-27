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
 * ✅ FRONTEND COMPATIBILITY ROUTE (ADDED)
 * GET /api/wallet
 * Internally behaves like /balance
 */
router.get("/", auth, async (req, res) => {
  try {
    const businessId = req.user.business;

    if (!businessId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const wallet = await Wallet.findOne({
      owner: businessId,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.status(404).json({ message: "Business wallet not found" });
    }

    res.json({
      walletId: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (err) {
    console.error("❌ Wallet root fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch wallet" });
  }
});

/**
 * 🏢 GET BUSINESS WALLET BALANCE (SECURE)
 * Uses businessId directly from JWT payload
 */
router.get("/balance", auth, async (req, res) => {
  try {
    const businessId = req.user.business;

    if (!businessId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const wallet = await Wallet.findOne({
      owner: businessId,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.status(404).json({ message: "Business wallet not found" });
    }

    res.json({
      walletId: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (err) {
    console.error("❌ Business wallet balance error:", err.message);
    res.status(500).json({ message: "Failed to fetch business wallet balance" });
  }
});

/**
 * 👤 GET USER WALLET BALANCE (SECURE)
 */
router.get("/user/balance", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const wallet = await Wallet.findOne({
      owner: userId,
      ownerType: "USER"
    });

    if (!wallet) {
      return res.status(404).json({ message: "User wallet not found" });
    }

    res.json({
      walletId: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (err) {
    console.error("❌ User wallet balance error:", err.message);
    res.status(500).json({ message: "Failed to fetch user wallet balance" });
  }
});

/**
 * CREATE WALLET (LEGACY / ADMIN)
 */
router.post("/create", async (req, res) => {
  try {
    const { owner, ownerType = "USER" } = req.body;

    if (!owner) {
      return res.status(400).json({ message: "Owner is required" });
    }

    let wallet = await Wallet.findOne({ owner });
    if (wallet) {
      return res.json({ message: "Wallet already exists", wallet });
    }

    wallet = await Wallet.create({
      owner,
      ownerType,
      balance: 0,
      currency: "KES"
    });

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
