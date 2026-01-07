const Wallet = require("../models/Wallet");

/**
 * PIN attempt limit middleware
 * - Max attempts: 3
 * - Lock duration: 15 minutes
 */
const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

module.exports = async function pinLimit(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const wallet = await Wallet.findOne({ phone });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Initialize fields safely
    if (wallet.pinAttempts === undefined) wallet.pinAttempts = 0;
    if (wallet.pinLockedUntil === undefined) wallet.pinLockedUntil = null;

    // If wallet is locked
    if (
      wallet.pinLockedUntil &&
      new Date(wallet.pinLockedUntil).getTime() > Date.now()
    ) {
      const remainingMs =
        new Date(wallet.pinLockedUntil).getTime() - Date.now();
      const minutes = Math.ceil(remainingMs / 60000);

      return res.status(423).json({
        message: `Wallet locked due to multiple wrong PIN attempts. Try again in ${minutes} minute(s).`,
      });
    }

    // If lock expired → reset
    if (
      wallet.pinLockedUntil &&
      new Date(wallet.pinLockedUntil).getTime() <= Date.now()
    ) {
      wallet.pinAttempts = 0;
      wallet.pinLockedUntil = null;
      await wallet.save();
    }

    // Attach wallet to request
    req.wallet = wallet;

    next();
  } catch (err) {
    console.error("PIN limit middleware error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
