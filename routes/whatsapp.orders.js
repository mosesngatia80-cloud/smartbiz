const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");

/**
 * 🔒 HARD-BINDED BUSINESS (MVP)
 * One WhatsApp number = One Business
 */
const BUSINESS_ID = "6977a75f31747055b1f1f60b";

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
    // LOAD BUSINESS WALLET
    // =====================
    const wallet = await Wallet.findOne({
      owner: BUSINESS_ID,
      ownerType: "BUSINESS",
    });

    if (!wallet) {
      return res.json({ reply: "❌ Business wallet missing" });
    }

    // =====================
    // PAY COMMAND
    // =====================
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

    // =====================
    // BUY COMMAND
    // =====================
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

    const keywords = parts.slice(1).join(" ");

    const product = await Product.findOne({
      business: BUSINESS_ID,
      name: { $regex: keywords, $options: "i" },
    });

    if (!product) {
      return res.json({ reply: "❌ Product not found" });
    }

    const total = product.price * qty;

    const order = await Order.create({
      business: BUSINESS_ID,
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
