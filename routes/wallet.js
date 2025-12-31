const express = require("express");
const Wallet = require("../models/Wallet");

const router = express.Router();

/**
 * TEMP: RESET WALLET INDEX (RUN ONCE)
 */
router.get("/__reset_index", async (req, res) => {
  try {
    await Wallet.collection.dropIndexes();
    res.json({ message: "Wallet indexes dropped" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREATE WALLET (IDEMPOTENT)
 */
router.post("/create", async (req, res) => {
  try {
    const { owner, type = "USER" } = req.body;

    if (!owner) {
      return res.status(400).json({ message: "Owner is required" });
    }

    let wallet = await Wallet.findOne({ owner });

    if (wallet) {
      return res.json({
        message: "Wallet already exists",
        wallet
      });
    }

    wallet = await Wallet.create({
      owner,
      type
    });

    res.json({
      message: "Wallet created",
      wallet
    });
  } catch (err) {
    console.error("❌ Wallet create error:", err.message);
    res.status(500).json({ message: "Wallet creation failed" });
  }
});

/**
 * GET WALLET
 */
router.get("/:owner", async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ owner: req.params.owner });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
