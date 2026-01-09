const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Wallet = require("../models/Wallet");

/**
 * ADMIN: CREDIT WALLET (MOCK ONLY)
 */
router.post("/credit-wallet", auth, async (req, res) => {
  try {
    if (process.env.PAYMENT_MODE !== "mock") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { walletId, amount } = req.body;

    if (!walletId || !amount) {
      return res
        .status(400)
        .json({ message: "walletId and amount required" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.balance += Number(amount);
    await wallet.save();

    res.json({
      success: true,
      walletId: wallet._id,
      newBalance: wallet.balance
    });
  } catch (err) {
    console.error("Admin credit error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
