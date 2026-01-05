const express = require("express");
const crypto = require("crypto");

const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

const router = express.Router();

/*
=====================================
 WALLET PAYMENT BRIDGE
 Smart Pay → Smart Biz
=====================================
 POST /api/payments/wallet
*/

router.post("/wallet", async (req, res) => {
  try {
    console.log("➡️ /api/payments/wallet HIT");
    console.log("📦 Payload:", req.body);

    const { orderId, amount, payer } = req.body;

    /* =============================
       0. BASIC VALIDATION
    ============================== */
    if (!orderId || !amount || !payer) {
      return res.status(400).json({
        success: false,
        message: "orderId, amount and payer are required"
      });
    }

    /* =============================
       1. FETCH ORDER
    ============================== */
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status === "PAID") {
      return res.status(409).json({
        success: false,
        message: "Order already paid",
        reference: order.paymentRef
      });
    }

    if (Number(order.amount) !== Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Amount mismatch"
      });
    }

    /* =============================
       2. FEE RULES
    ============================== */
    let fee = 0;

    if (amount <= 100) {
      fee = 0;
    } else if (amount <= 1000) {
      fee = amount * 0.005;
    } else {
      fee = amount * 0.01;
    }

    fee = Math.min(Math.round(fee), 20);
    const totalDebit = amount + fee;

    /* =============================
       3. LOAD WALLETS
    ============================== */
    const customerWallet = await Wallet.findOne({ owner: payer });
    const businessWallet = await Wallet.findOne({ owner: order.businessWallet });
    const platformWallet = await Wallet.findOne({ owner: "PLATFORM_WALLET" });

    if (!customerWallet) {
      return res.status(404).json({
        success: false,
        message: "Customer wallet not found"
      });
    }

    if (!businessWallet) {
      return res.status(404).json({
        success: false,
        message: "Business wallet not found"
      });
    }

    if (!platformWallet) {
      return res.status(500).json({
        success: false,
        message: "Platform wallet missing"
      });
    }

    if (customerWallet.balance < totalDebit) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    /* =============================
       4. EXECUTE TRANSFER
    ============================== */
    const reference =
      "TXN_" + crypto.randomBytes(4).toString("hex").toUpperCase();

    customerWallet.balance -= totalDebit;
    businessWallet.balance += amount;
    platformWallet.balance += fee;

    await customerWallet.save();
    await businessWallet.save();
    await platformWallet.save();

    /* =============================
       5. RECORD TRANSACTION
    ============================== */
    await Transaction.create({
      from: payer,
      to: order.businessWallet,
      amount,
      fee,
      reference,
      type: "ORDER_PAYMENT",
      orderId
    });

    /* =============================
       6. LOCK ORDER
    ============================== */
    order.status = "PAID";
    order.paymentRef = reference;
    order.paidAt = new Date();
    await order.save();

    /* =============================
       7. RESPONSE
    ============================== */
    return res.json({
      success: true,
      message: "Payment successful",
      orderId,
      reference,
      amount,
      fee,
      balance: customerWallet.balance
    });

  } catch (err) {
    console.error("❌ Wallet payment error:", err);
    return res.status(500).json({
      success: false,
      message: "Payment failed"
    });
  }
});

module.exports = router;
