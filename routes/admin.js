const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Business = require("../models/Business");

/**
 * DEV ONLY: Set business wallet
 * Ensures DB connection is READY before updating
 */
router.post("/set-wallet", async (req, res) => {
  try {
    // ⏳ Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⏳ Waiting for MongoDB connection...");
      await mongoose.connection.asPromise();
    }

    const businessId = "695df3df6c1a1398235568b9";
    const walletId = "66b1f0e9a9c9b4f2e8123456";

    const result = await Business.updateOne(
      { _id: businessId },
      { $set: { walletId } }
    );

    res.json({
      message: "Wallet set",
      result
    });
  } catch (err) {
    console.error("Admin wallet error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
