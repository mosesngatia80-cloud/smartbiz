const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");

// IMPORTANT: use the SAME Order model the dashboard uses
const Order = require("../models/order.model").default;

/**
 * HARD-LINKED BUSINESS (MVP)
 * One WhatsApp number → One Business
 */
const BUSINESS_ID = "6977a75f31747055b1f1f60b";

/**
 * TEMP CUSTOMER ID (WhatsApp customers are not registered users yet)
 * This is VALID and CBK-acceptable for MVP
 */
const WHATSAPP_CUSTOMER_ID = "000000000000000000000001";

/**
 * Track pending orders per phone
 */
const lastOrderBySender = {};

router.post("/message", async (req, res) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /* ================= BUSINESS ================= */
    const business = await Business.findById(BUSINESS_ID);
    if (!business) {
      return res.json({ reply: "❌ Business not configured" });
    }

    /* ================= PAY ================= */
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];
      if (!orderId) {
        return res.json({
          reply: "❌ No pending order. Use: buy <product> <qty>"
        });
      }

      return res.json({
        reply:
          "💳 Payment initiated.\n" +
          "Complete payment on your phone.",
        orderId
      });
    }

    /* ================= BUY ================= */
    const parts = message.split(/\s+/);

    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Use: buy <product> <quantity>"
      });
    }

    const quantity = parseInt(parts.pop(), 10);
    if (!quantity || quantity <= 0) {
      return res.json({ reply: "❌ Invalid quantity" });
    }

    const keywords = parts.slice(1).join(" ");

    const product = await Product.findOne({
      business: business._id,
      name: { $regex: keywords, $options: "i" }
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const totalAmount = product.price * quantity;

    /* ================= CREATE ORDER ================= */
    const order = await Order.create({
      business: business._id,
      customer: WHATSAPP_CUSTOMER_ID,
      items: [
        {
          product: product._id,
          quantity
        }
      ],
      totalAmount,
      status: "pending"
    });

    lastOrderBySender[sender] = order._id.toString();

    return res.json({
      reply:
        "🛒 Order created\n\n" +
        `${product.name} × ${quantity}\n` +
        `Total: KES ${totalAmount}\n\n` +
        "Reply PAY to continue",
      orderId: order._id
    });

  } catch (err) {
    console.error("❌ WHATSAPP ORDER ERROR:", err);
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
