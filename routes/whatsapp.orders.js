const express = require("express");
const router = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const Wallet   = require("../models/Wallet");
const Business = require("../models/Business");

/**
 * 👤 SYSTEM WHATSAPP GUEST USER (REQUIRED BY SCHEMA)
 * Used for customers who do not have dashboard accounts
 */
const WHATSAPP_GUEST_USER_ID = "000000000000000000000001";

/**
 * 🧠 In-memory session store (MVP)
 * sender -> last pending orderId
 */
const lastOrderBySender = {};

/**
 * ===========================
 * WHATSAPP MESSAGE HANDLER
 * ===========================
 */
router.post("/message", async (req, res) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /**
     * 🔗 FIND BUSINESS BY LINKED WHATSAPP NUMBER
     * This replaces hard-coded BUSINESS_ID
     */
    const business = await Business.findOne({
      whatsappNumber: sender
    });

    if (!business) {
      return res.json({
        reply:
          "❌ This WhatsApp number is not linked to any business.\n" +
          "Please ask the merchant to link WhatsApp in their dashboard."
      });
    }

    /**
     * 💼 LOAD BUSINESS WALLET
     */
    const wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.json({ reply: "❌ Business wallet missing" });
    }

    /**
     * 💳 PAY COMMAND
     */
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({ reply: "❌ No pending order" });
      }

      return res.json({
        reply:
          "💳 Payment initiated.\n" +
          "Complete payment on your phone.",
        orderId
      });
    }

    /**
     * 🛒 BUY COMMAND
     * Format: buy <product> <qty>
     */
    const parts = message.split(/\s+/);

    if (parts[0] !== "buy") {
      return res.json({ reply: "❌ Use: buy <product> <qty>" });
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

    /**
     * 🧾 CREATE ORDER (UNPAID)
     */
    const order = await Order.create({
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
      status: "UNPAID"
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
    console.error("❌ WHATSAPP ORDER ERROR:", err.message);
    return res.json({ reply: "❌ ERROR: " + err.message });
  }
});

module.exports = router;
