const express = require("express");
const router = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const Wallet   = require("../models/Wallet");
const Business = require("../models/Business");
const Customer = require("../models/Customer");

/**
 * 🔒 HARD-BINDED BUSINESS (MVP)
 * One WhatsApp number = One Business
 */
const BUSINESS_ID = "6977a75f31747055b1f1f60b";

/**
 * In-memory session store (MVP)
 */
const lastOrderBySender = {};

/**
 * =====================
 * WHATSAPP MESSAGE HANDLER
 * =====================
 */
router.post("/message", async (req, res) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /** =====================
     * LOAD BUSINESS
     * ===================== */
    const business = await Business.findById(BUSINESS_ID);
    if (!business) {
      return res.json({ reply: "❌ Business not configured" });
    }

    /** =====================
     * LOAD OR CREATE CUSTOMER (KEY FIX)
     * ===================== */
    let customer = await Customer.findOne({
      phone: sender,
      business: business._id
    });

    if (!customer) {
      customer = await Customer.create({
        phone: sender,
        business: business._id,
        source: "WHATSAPP"
      });
    }

    /** =====================
     * PAY COMMAND
     * ===================== */
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({
          reply: "❌ No pending order. Send: buy <product> <qty>"
        });
      }

      return res.json({
        reply:
          "💳 Payment initiated.\n" +
          "Complete payment on your phone.\n" +
          "You will receive confirmation shortly.",
        orderId
      });
    }

    /** =====================
     * BUY COMMAND
     * ===================== */
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

    /** =====================
     * CREATE ORDER (FIXED)
     * ===================== */
    const order = await Order.create({
      business: business._id,
      customer: customer._id,            // ✅ REQUIRED & VALID
      owner: business.owner || null,

      items: [
        {
          product: product._id,
          quantity: qty
        }
      ],

      status: "pending",
      totalAmount: total,                 // ✅ correct field
      paymentMethod: "mpesa"
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
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
