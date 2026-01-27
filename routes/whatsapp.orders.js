const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");

// Simple in-memory session (OK for MVP)
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
    // PAY COMMAND
    // =====================
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({
          reply: "❌ No pending order found.\nSend: Buy <product> <qty>",
        });
      }

      return res.json({
        reply:
          "💳 Payment initiated.\n\n" +
          "Complete payment on your phone.\n" +
          "You will receive a receipt shortly.",
        orderId,
      });
    }

    // =====================
    // BUY COMMAND
    // =====================
    const parts = message.split(/\s+/);

    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Invalid command.\nUse: Buy <product> <qty> or PAY",
      });
    }

    const qty = parseInt(parts.pop(), 10);
    if (isNaN(qty) || qty <= 0) {
      return res.json({ reply: "❌ Invalid quantity" });
    }

    const keywords = parts.slice(1).join(" ");

    const product = await Product.findOne({
      name: { $regex: keywords, $options: "i" },
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const order = await Order.create({
      business: product.business,
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          qty,
          lineTotal: product.price * qty,
        },
      ],
      total: product.price * qty,
      status: "UNPAID",
    });

    lastOrderBySender[sender] = order._id.toString();

    res.json({
      reply:
        `🛒 Order created!\n\n` +
        `Product: ${product.name}\n` +
        `Qty: ${qty}\n` +
        `Total: KES ${order.total}\n\n` +
        `💳 Reply PAY to complete payment.`,
      orderId: order._id,
    });
  } catch (err) {
    console.error("WhatsApp error FULL:", err);
    res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
