const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");

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

    // PAY
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];
      if (!orderId) {
        return res.json({ reply: "❌ No pending order. Send: Buy <product> <qty>" });
      }
      return res.json({
        reply: "💳 Payment initiated. Complete on your phone.",
        orderId,
      });
    }

    // BUY
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
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const wallet = await Wallet.findOne({
      owner: product.business,
      ownerType: "BUSINESS",
    });

    if (!wallet) {
      return res.json({ reply: "❌ Business wallet missing" });
    }

    const total = product.price * qty;

    const order = await Order.create({
      business: product.business,
      businessWalletId: wallet._id,
      customerUserId: null,
      customerPhone: sender,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        qty,
        lineTotal: total,
      }],
      total,
      status: "UNPAID",
    });

    lastOrderBySender[sender] = order._id.toString();

    res.json({
      reply: `🛒 Order created\n${product.name} × ${qty}\nTotal: KES ${total}\nReply PAY`,
      orderId: order._id,
    });
  } catch (err) {
    console.error("WhatsApp error FULL:", err);
    res.json({ reply: "⚠️ Server error" });
  }
});

// 🔴 THIS LINE IS CRITICAL
module.exports = router;
