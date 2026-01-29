const express = require("express");
const router = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const Wallet   = require("../models/Wallet");
const Business = require("../models/Business");

/**
 * 🔒 HARD-BINDED BUSINESS (MVP)
 */
const BUSINESS_ID = "6977a75f31747055b1f1f60b";

/**
 * In-memory session store (MVP)
 */
const lastOrderBySender = {};

router.post("/message", async (req, res) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    const business = await Business.findById(BUSINESS_ID);
    if (!business) {
      return res.json({ reply: "❌ Business not configured" });
    }

    const wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.json({ reply: "❌ Business wallet missing" });
    }

    // PAY
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];
      if (!orderId) {
        return res.json({
          reply: "❌ No pending order. Send: buy <product> <qty>"
        });
      }

      return res.json({
        reply:
          "💳 Payment initiated.\nComplete payment on your phone.",
        orderId
      });
    }

    // BUY
    const parts = message.split(/\s+/);
    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Invalid command.\nUse: buy <product> <qty>"
      });
    }

    const qty = parseInt(parts.pop(), 10);
    if (!qty || qty <= 0) {
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

    const total = product.price * qty;

    // ✅ CORRECT ORDER PAYLOAD (MATCHES SCHEMA)
    const order = await Order.create({
      business: business._id,
      businessWalletId: wallet._id,

      customerUserId: null,
      customerPhone: sender,

      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          qty,
          lineTotal: total
        }
      ],

      total,
      status: "UNPAID"
    });

    lastOrderBySender[sender] = order._id.toString();

    return res.json({
      reply:
        `🛒 Order created\n\n${product.name} × ${qty}\nTotal: KES ${total}\n\nReply PAY to continue`,
      orderId: order._id
    });

  } catch (err) {
    console.error("❌ WHATSAPP ORDER ERROR:", err);
    return res.json({ reply: "❌ ERROR: " + err.message });
  }
});

module.exports = router;
