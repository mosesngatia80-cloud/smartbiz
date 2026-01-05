const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

/*
=====================================
 PAYMENTS ROUTES
 Smart Pay → Smart Biz
 Mounted at: /api/payments
=====================================
*/

/* =====================================
   POST /api/payments/wallet
===================================== */
router.post("/wallet", async (req, res) => {
  try {
    console.log("➡️ /api/payments/wallet HIT");
    console.log("📦 Payload:", req.body);

    const { orderId, amount, payer } = req.body;

    if (!orderId || !amount || !payer) {
      return res.status(400).json({
        success: false,
        message: "orderId, amount and payer are required"
      });
    }

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

    /* ===== Fee Rules ===== */
    let fee = 0;
    if (amount <= 100) fee = 0;
    else if (amount <= 1000) fee = amount * 0.005;
    else fee = amount * 0.01;

    fee = Math.min(Math.round(fee), 20);
    const totalDebit = amount + fee;

    /* ===== Wallets ===== */
    const customerWallet = await Wallet.findOne({ owner: payer });
    const businessWallet = await Wallet.findOne({ owner: order.businessWallet });
    const platformWallet = await Wallet.findOne({ owner: "PLATFORM_WALLET" });

    if (!customerWallet || !businessWallet || !platformWallet) {
      return res.status(404).json({
        success: false,
        message: "Required wallet missing"
      });
    }

    if (customerWallet.balance < totalDebit) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    /* ===== Execute Transfer ===== */
    const reference =
      "TXN_" + crypto.randomBytes(4).toString("hex").toUpperCase();

    customerWallet.balance -= totalDebit;
    businessWallet.balance += amount;
    platformWallet.balance += fee;

    await customerWallet.save();
    await businessWallet.save();
    await platformWallet.save();

    await Transaction.create({
      from: payer,
      to: order.businessWallet,
      amount,
      fee,
      reference,
      type: "ORDER_PAYMENT",
      orderId
    });

    order.status = "PAID";
    order.paymentRef = reference;
    order.paidAt = new Date();
    await order.save();

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

/* =====================================
   POST /api/payments/callback
===================================== */
router.post("/callback", async (req, res) => {
  try {
    const { orderId, paymentRef, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status !== "SUCCESS") {
      order.status = "failed";
      await order.save();
      return res.json({ message: "Payment failed" });
    }

    order.status = "paid";
    order.paymentRef = paymentRef;
    await order.save();

    let itemsText = "";
    for (const item of order.items) {
      itemsText += `- ${item.product.name} x${item.qty} = KES ${
        item.qty * item.price
      }\n`;
    }

    const receipt =
      `🧾 *PAYMENT RECEIPT*\n\n` +
      `Order ID: ${order._id}\n` +
      `Payment Ref: ${paymentRef}\n\n` +
      `Items:\n${itemsText}\n` +
      `TOTAL: KES ${order.total}\n\n` +
      `✅ Payment successful.\nThank you for shopping with us!`;

    res.json({
      message: "Order confirmed",
      receipt
    });

  } catch (err) {
    console.error("Payment callback error:", err.message);
    res.status(500).json({ message: "Callback error" });
  }
});

module.exports = router;
