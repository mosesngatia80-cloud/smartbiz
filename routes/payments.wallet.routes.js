const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const router = express.Router();

const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

// 📲 WhatsApp utils
const sendWhatsAppMessage = require("../utils/sendWhatsAppMessage");
const formatReceipt = require("../utils/receiptFormatter");

const PLATFORM_OWNER_ID = new mongoose.Types.ObjectId("000000000000000000000001");

router.post("/wallet", async (req, res) => {
  try {
    const { orderId, payer, amount } = req.body;

    if (!orderId || !payer || !amount) {
      return res.status(400).json({
        success: false,
        message: "orderId, payer and amount are required"
      });
    }

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

    /* ================= BUSINESS WALLET ================= */
    let businessWallet = await Wallet.findOne({
      _id: order.businessWalletId,
      ownerType: "BUSINESS"
    });

    if (!businessWallet) {
      return res.status(500).json({
        success: false,
        message: "Business wallet not found"
      });
    }

    /* ================= PLATFORM WALLET ================= */
    let platformWallet = await Wallet.findOne({
      owner: PLATFORM_OWNER_ID,
      ownerType: "BUSINESS"
    });

    if (!platformWallet) {
      platformWallet = await Wallet.create({
        owner: PLATFORM_OWNER_ID,
        ownerType: "BUSINESS",
        balance: 0,
        currency: "KES"
      });
    }

    /* ================= MOCK PAYMENT ================= */
    if (process.env.PAYMENT_MODE === "mock") {
      businessWallet.balance += amount;
      platformWallet.balance += fee;
    }

    const reference =
      "TXN_" + crypto.randomBytes(4).toString("hex").toUpperCase();

    await businessWallet.save();
    await platformWallet.save();

    await Transaction.create({
      from: payer,
      to: order.businessWalletId,
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

    try {
      const receiptMessage = formatReceipt({
        type: "PAYMENT",
        businessName: "Navu Smart Biz",
        amount,
        reference,
        date: new Date()
      });

      sendWhatsAppMessage(order.customerPhone, receiptMessage);
    } catch (e) {}

    return res.json({
      success: true,
      message: "Payment successful",
      orderId: order._id,
      reference,
      amount,
      fee,
      businessBalance: businessWallet.balance
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
