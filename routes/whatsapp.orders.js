const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");

// Simple in-memory session (OK for MVP)
const lastOrderBySender = {};

router.post("/message", async (req, res) => {
  try {
    const { text, sender } = req.body;

    if (!text || !sender) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /* ================= PAY ================= */
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({
          reply: "❌ No pending order found.\nSend: Buy <product> <qty>",
        });
      }

      return res.json({
        reply:
          "💳 Payment coming soon.\n\n" +
          "Vendor will confirm your payment.\n" +
          "You will receive a receipt.",
        orderId,
      });
    }

    /* ================= BUY ================= */
    const parts = message.split(/\s+/);
    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Invalid command.\nUse: Buy <product> <qty>",
      });
    }

    const qty = parseInt(parts.pop(), 10);
    if (!qty || qty <= 0) {
      return res.json({ reply: "❌ Invalid quantity" });
    }

    const name = parts.slice(1).join(" ");

    const product = await Product.findOne({
      name: { $regex: name, $options: "i" },
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const total = product.price * qty;

    const order = await Order.create({
      business: product.business,
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
      source: "WHATSAPP",
    });

    lastOrderBySender[sender] = order._id.toString();

    return res.json({
      reply:
        `🛒 Order received!\n\n` +
        `Product: ${product.name}\n` +
        `Qty: ${qty}\n` +
        `Total: KES ${total}\n\n` +
        `💬 Vendor will guide you to pay.`,
      orderId: order._id,
    });
  } catch (err) {
    console.error("WhatsApp ORDER error:", err.message);
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
