const express = require("express");
const router = express.Router();
const Wallet = require("../models/Wallet");

// 🔐 internal auth
function internalAuth(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.CT_INTERNAL_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// 💰 TOP-UP WALLET (TEMP DEBUG)
router.post("/wallet/topup", internalAuth, async (req, res) => {
  try {
    const { business, amount } = req.body;

    const wallet = await Wallet.findOne({
      owner: business,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.balance += Number(amount || 0);
    await wallet.save();

    res.json({
      success: true,
      balance: wallet.balance
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
