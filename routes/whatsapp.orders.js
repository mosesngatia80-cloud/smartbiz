const express = require("express");
const router = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const Wallet   = require("../models/Wallet");
const Business = require("../models/Business");

/* 🔥 NEW: SERVICE LAYER */
const { createOrder } = require("../services/order.service");

/**
 * SYSTEM WHATSAPP GUEST USER
 */
const WHATSAPP_GUEST_USER_ID = "000000000000000000000001";

const lastOrderBySender = {};

/**
 * WHATSAPP MESSAGE ENGINE
 */
router.post("/message", async (req, res) => {

  try {

    const { sender, text, businessNumber } = req.body;

    if (!sender || !text || !businessNumber) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    const business = await Business.findOne({
      whatsappNumber: businessNumber
    });

    if (!business) {
      return res.json({
        reply: "❌ Business not linked"
      });
    }

    const wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.json({ reply: "❌ Business wallet missing" });
    }

    /* =========================
       🛒 BUY FLOW (UPDATED)
       ========================= */

    const parts = message.split(/\s+/);

    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Use: buy <product> <qty>"
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

    /* 🔥 UPDATED: USE SERVICE LAYER */
    const order = await createOrder({
      business: business._id,
      businessWalletId: wallet._id,
      customerUserId: WHATSAPP_GUEST_USER_ID,
      customerPhone: sender,
      items: [
        {
          product: product._id,
          quantity: qty
        }
      ],
      total,
      status: "UNPAID",
      paymentMethod: "CASH",
      source: "WHATSAPP"
    });

    lastOrderBySender[sender] = order._id.toString();

    return res.json({
      reply:
        `🛒 Order created\n\n` +
        `${product.name} × ${qty}\n` +
        `Total: KES ${total}\n\n` +
        `Reply PAY to continue`,
      orderId: order._id
    });

  } catch (err) {
    console.error("WHATSAPP ERROR:", err.message);
    return res.json({
      reply: "❌ ERROR: " + err.message
    });
  }
});

module.exports = router;
