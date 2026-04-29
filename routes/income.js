const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

/**
 * ===========================
 * MPESA INCOME (READ ONLY)
 * ===========================
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    // 1️⃣ Find business wallet
    const wallet = await Wallet.findOne({
      ownerType: "BUSINESS",
      ownerUser: userId
    });

    if (!wallet) {
      return res.json({
        totalIncome: 0,
        transactions: []
      });
    }

    // 2️⃣ Fetch MPESA CREDIT transactions
    const transactions = await Transaction.find({
      wallet: wallet._id,
      type: "CREDIT",
      channel: "MPESA",
      status: "SUCCESS"
    }).sort({ createdAt: -1 });

    // 3️⃣ Calculate total income
    const totalIncome = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    return res.json({
      totalIncome,
      transactions: transactions.map(t => ({
        amount: t.amount,
        phone: t.phone,
        reference: t.reference,
        date: t.createdAt
      }))
    });

  } catch (err) {
    console.error("❌ INCOME FETCH ERROR:", err.message);
    return res.status(500).json({ message: "Failed to load income" });
  }
});

module.exports = router;
