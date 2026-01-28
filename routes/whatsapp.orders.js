const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Business = require("../models/Business");

// In-memory session (MVP)
const lastOrderBySender = {};

// =====================
// WHATSAPP MESSAGE HANDLER
// =====================
router.post("/message", async (req, res) => {
  try {
    const { text, sender } = req.body;

    if (!text || !sender) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    // =====================
    // RESOLVE BUSINESS WALLET (SOURCE OF TRUTH)
    // =====================
    let wallet = await Wallet.findOne({ ownerType: "BUSINESS" });

    if (!wallet) {
      const business = await Business.findOne();
      if (!business) {
        return res.json({ reply: "❌ Business not configured" });
      }

      wallet = await Wallet.create({
        owner: business._id,
        ownerType: "BUSINESS",
        balance: 0,
        currency: "KES",
      });
    }

    const businessId = wallet.owner;

    // =====================
    // PAY (UPDATED ONLY)
    // =====================
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({
          reply: "❌ No pending order. Send: Buy <product> <qty>",
        });
      }

      const order = await Order.findById(orderId);
      if (!order || order.status !== "UNPAID") {
        return res.json({ reply: "❌ Order not found or already paid" });
      }

      // Credit wallet
      wallet.balance += order.total;
      await wallet.save();

      // Mark order paid
      order.status = "PAID";
      order.paidAt = new Date();
      await order.save();

      return res.json({
        reply:
          "✅ Payment successful!\n\n" +
          "Your order is confirmed.\n" +
          "Thank you for shopping with us 🙏",
        orderId: order._id,
        walletBalance: wallet.balance,
      });
    }

    // =====================
    // BUY
    // =====================
    const parts = message.split(/\s+/);
    if (parts[0] !== "buy") {
      return res.json({ reply: "❌ Use: Buy <product> <qty>" });
    }

    const qty = parseInt(parts.pop(), 10);
    if (!qty || qty <= 0) {
      return res.json({ reply: "❌ Invalid quantity" });
    }

    const keywords = parts.slice(1).join(" ");

    const product = await Product.findOne({
      name: { $regex: keywords, $options: "i" },
      business: businessId,
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const total = product.price * qty;

    const order = await Order.create({
      business: businessId,
      businessWalletId: wallet._id,
      customerUserId: null,
      customerPhone: sender,
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          qty,
          lineTotal: total,
        },
      ],
      total,
      status: "UNPAID",
    });

    lastOrderBySender[sender] = order._id.toString();

    return res.json({
      reply:
        `🛒 Order created\n` +
        `${product.name} × ${qty}\n` +
        `Total: KES ${total}\n\n` +
        `Reply PAY to complete payment`,
      orderId: order._id,
    });

  } catch (err) {
    console.error("WhatsApp error FULL:", err);
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
