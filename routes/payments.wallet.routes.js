const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

/*
================================================
 ORDER-BASED WALLET PAYMENT
 FINAL – ENUM SAFE – SELF-HEALING
================================================
*/

router.post("/wallet", async (req, res) => {
  try {
    console.log("➡️ ORDER WALLET PAYMENT HIT");
    console.log("📦 Payload:", req.body);

    const { orderId, payer, amount } = req.body;

    if (!orderId || !payer || !amount) {
      return res.status(400).json({
        success: false,
        message: "orderId, payer and amount are required"
      });
    }

    /* ================= ORDER ================= */
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "PAID") {
      return res.status(409).json({
        success: false,
        message: "Order already paid",
        reference: order.paymentRef
      });
    }

    if (Number(order.total) !== Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Amount mismatch"
      });
    }

    /* ================= FEES ================= */
    let fee = 0;
    if (amount <= 100) fee = 0;
    else if (amount <= 1000) fee = amount * 0.005;
    else fee = amount * 0.01;

    fee = Math.min(Math.round(fee), 20);
    const totalDebit = amount + fee;

    /* ================= CUSTOMER WALLET ================= */
    const customerWallet = await Wallet.findOne({
      owner: payer,
      type: "USER"
    });

    if (!customerWallet) {
      return res.status(404).json({
        success: false,
        message: "Customer wallet not found"
      });
    }

    /* ================= BUSINESS WALLET OWNER (SAFE) ================= */
    const businessWalletOwner =
      order.businessWalletId ||
      (order.business ? order.business.toString() : null);

    if (!businessWalletOwner) {
      return res.status(500).json({
        success: false,
        message: "Order has no business wallet reference"
      });
    }

    /* ================= BUSINESS WALLET ================= */
    let businessWallet = await Wallet.findOne({
      owner: businessWalletOwner
    });

    if (!businessWallet) {
      console.log("⚠️ Creating business wallet:", businessWalletOwner);
      businessWallet = await Wallet.create({
        owner: businessWalletOwner,
        type: "BUSINESS",
        balance: 0
      });
    }

    /* ================= PLATFORM WALLET (ENUM SAFE) ================= */
    let platformWallet = await Wallet.findOne({ owner: "PLATFORM_WALLET" });

    if (!platformWallet) {
      console.log("⚠️ Creating platform wallet");
      platformWallet = await Wallet.create({
        owner: "PLATFORM_WALLET",
        type: "BUSINESS",
        balance: 0
      });
    }

    if (customerWallet.balance < totalDebit) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    /* ================= TRANSFER ================= */
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
      to: businessWalletOwner,
      amount,
      fee,
      reference,
      type: "ORDER_PAYMENT",
      orderId: order._id
    });

    order.status = "PAID";
    order.paymentRef = reference;
    order.paidAt = new Date();
    await order.save();

    return res.json({
      success: true,
      message: "Payment successful",
      orderId: order._id,
      reference,
      amount,
      fee,
      balance: customerWallet.balance
    });

  } catch (err) {
    console.error("❌ ORDER WALLET PAYMENT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
