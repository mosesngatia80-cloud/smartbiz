const express = require("express");
const fetch = require("node-fetch");
const Product = require("../models/Product");

const router = express.Router();

/**
 * CONFIG (MVP – single business)
 */
const SMART_BIZ_API = process.env.SMART_BIZ_API;
const SMART_CONNECT_JWT = process.env.SMART_CONNECT_JWT;
const BUSINESS_ID = process.env.BUSINESS_ID;

/**
 * In-memory session:
 * sender -> last order id
 */
const lastOrderBySender = {};

/**
 * ===========================
 * WHATSAPP MESSAGE HANDLER
 * ===========================
 */
router.post("/message", async (req, res) => {
  try {
    const { text, sender } = req.body;

    if (!text || !sender) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /**
     * =====================
     * PAY COMMAND
     * =====================
     */
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({
          reply: "❌ No pending order. Send: Buy <product> <qty>"
        });
      }

      return res.json({
        reply:
          "💳 Payment started.\n" +
          "Complete payment on your phone.\n" +
          "You will receive confirmation shortly."
      });
    }

    /**
     * =====================
     * BUY COMMAND
     * =====================
     */
    const parts = message.split(/\s+/);

    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Invalid command.\nUse: Buy <product> <qty>"
      });
    }

    const qty = parseInt(parts.pop(), 10);
    if (!qty || qty <= 0) {
      return res.json({ reply: "❌ Invalid quantity" });
    }

    const keywords = parts.slice(1).join(" ");

    /**
     * Find product (vendor-managed)
     */
    const product = await Product.findOne({
      business: BUSINESS_ID,
      name: { $regex: keywords, $options: "i" }
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const total = product.price * qty;

    /**
     * =====================
     * CREATE ORDER VIA API
     * =====================
     * 🔒 SAME PATH AS DASHBOARD
     */
    const orderRes = await fetch(`${SMART_BIZ_API}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SMART_CONNECT_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        business: BUSINESS_ID,
        items: [
          {
            product: product._id,
            qty
          }
        ],
        total
      })
    });

    if (!orderRes.ok) {
      console.error("Order API error:", await orderRes.text());
      return res.json({ reply: "⚠️ Failed to create order" });
    }

    const order = await orderRes.json();

    lastOrderBySender[sender] = order._id;

    return res.json({
      reply:
        `🛒 Order created\n\n` +
        `${product.name} × ${qty}\n` +
        `Total: KES ${total}\n\n` +
        `Reply PAY to continue`
    });

  } catch (err) {
    console.error("WhatsApp order error:", err.message);
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
