console.log("✅ smartpay.webhook.js LOADED");

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Receipt = require("../models/Receipt");

/* ================= NORMALIZATION ================= */
function normalizeStatus(status) {
  if (!status) return "UNPAID";
  const s = String(status).toUpperCase();
  if (s === "PAID") return "PAID";
  if (s === "REFUNDED") return "REFUNDED";
  if (s === "PENDING_PAYMENT") return "UNPAID";
  if (s === "PENDING") return "UNPAID";
  return "UNPAID";
}

/* ================= SIGNATURE ================= */
function verifySignature(req) {
  const secret = process.env.SMARTPAY_SECRET;
  if (!secret) return true;

  const signature = req.headers["x-smartpay-signature"];
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

router.post("/", async (req, res) => {
  console.log("🚀 SmartPay webhook HIT", req.body);

  if (!verifySignature(req)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const { orderId, amount, status, reference } = req.body;
  if (!orderId || !amount || !status || !reference) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const normalizedStatus = normalizeStatus(order.status);

    // 🔒 Idempotency
    if (normalizedStatus === "PAID") {
      const existingTxn = await Transaction.findOne({ reference });
      const existingReceipt = existingTxn
        ? await Receipt.findOne({ transactionId: existingTxn._id })
        : null;

      return res.json({
        ok: true,
        message: "Order already paid",
        reference,
        receiptId: existingReceipt?.receiptId || null
      });
    }

    if (status !== "SUCCESS") {
      return res.json({ ok: true, message: "Payment not successful" });
    }

    if (Number(order.total) !== Number(amount)) {
      return res.status(400).json({ message: "Amount mismatch" });
    }

    // 🔒 Strong idempotency by reference
    const existingTxn = await Transaction.findOne({ reference });
    if (existingTxn) {
      const existingReceipt = await Receipt.findOne({ transactionId: existingTxn._id });
      return res.json({
        ok: true,
        message: "Duplicate webhook ignored",
        reference,
        receiptId: existingReceipt?.receiptId || null
      });
    }

    // ===== Fees =====
    let fee = 0;
    if (amount <= 100) fee = 0;
    else if (amount <= 1000) fee = Math.round(amount * 0.005);
    else fee = Math.round(amount * 0.01);
    fee = Math.min(fee, 20);

    const businessAmount = amount - fee;
    const PLATFORM_OWNER_ID = new mongoose.Types.ObjectId("000000000000000000000001");

    // ===== Wallets (atomic) =====
    await Wallet.updateOne(
      { owner: order.businessWalletId, ownerType: "BUSINESS" },
      {
        $setOnInsert: {
          owner: order.businessWalletId,
          ownerType: "BUSINESS",
          currency: "KES"
        },
        $inc: { balance: businessAmount }
      },
      { upsert: true, runValidators: false }
    );

    await Wallet.updateOne(
      { owner: PLATFORM_OWNER_ID, ownerType: "BUSINESS" },
      {
        $setOnInsert: {
          owner: PLATFORM_OWNER_ID,
          ownerType: "BUSINESS",
          currency: "KES"
        },
        $inc: { balance: fee }
      },
      { upsert: true, runValidators: false }
    );

    // ===== Transaction =====
    const txn = await Transaction.create({
      from: "SMARTPAY",
      to: order.business,
      amount,
      fee,
      reference,
      type: "ORDER_PAYMENT",
      orderId: order._id
    });

    // ===== Order update =====
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "PAID",
          paymentMethod: "wallet",
          paymentRef: reference,
          paidAt: new Date()
        }
      },
      { runValidators: false }
    );

    // ===== Receipt =====
    const receipt = await Receipt.create({
      receiptId: "RCT-" + Date.now(),
      orderId: order._id,
      transactionId: txn._id,
      businessId: order.business,
      customerId: order.customerUserId || null,
      customerPhone: order.customerPhone || null,
      amount,
      paymentMethod: "SMARTPAY",
      status: "ISSUED"
    });

    return res.json({
      ok: true,
      message: "Payment processed (normalized)",
      receiptId: receipt.receiptId,
      amount,
      fee
    });

  } catch (err) {
    console.error("❌ SmartPay webhook error:", err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
