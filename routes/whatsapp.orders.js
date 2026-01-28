const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * ✅ MVP WHATSAPP ORDERS
 * - No wallet dependency
 * - No business guessing
 * - Matches existing Order schema (same as AI)
 */

// In-memory session (OK for MVP)
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
          reply: "❌ No pending order. Send: Buy <product> <qty>",
        });
      }

      return res.json({
        reply:
          "💳 Payment initiated.\n" +
          "Complete payment on your phone.\n" +
          "You will receive confirmation shortly.",
        orderId,
      });
    }

    /* ================= BUY ================= */
    const parts = message.split(/\s+/);
    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Use: Buy <product> <qty>",
      });
    }

    const qty = Number(parts.pop());
    if (!qty || qty <= 0) {
      return res.json({ reply: "❌ Invalid quantity" });
    }

    const keywords = parts.slice(1).join(" ");

    // 🔑 FIND PRODUCT (GLOBAL, MVP SAFE)
    const product = await Product.findOne({
      name: { $regex: keywords, $options: "i" },
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const total = product.price * qty;

    // ✅ CREATE ORDER (SAME SHAPE AS AI ORDERS)
    const order = await Order.create({
      business: product.business,
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
        `🛒 Order created\n\n` +
        `${product.name} × ${qty}\n` +
        `Total: KES ${total}\n\n` +
        `Reply PAY to continue`,
      orderId: order._id,
    });

  } catch (err) {
    console.error("❌ WhatsApp error FULL:", err);
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
