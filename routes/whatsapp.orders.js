const express = require("express");
const router = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const Wallet   = require("../models/Wallet");
const Business = require("../models/Business");

/**
 * 👤 SYSTEM WHATSAPP GUEST USER
 */
const WHATSAPP_GUEST_USER_ID = "000000000000000000000001";

/**
 * 🧠 In-memory session store (MVP)
 */
const lastOrderBySender = {};

router.post("/message", async (req, res) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /* 🔗 FIND BUSINESS */
    const business = await Business.findOne({ whatsappNumber: sender });
    if (!business) {
      return res.json({
        reply:
          "❌ This WhatsApp number is not linked to any business.\n" +
          "Please ask the merchant to link WhatsApp in their dashboard."
      });
    }

    /* 💼 LOAD WALLET */
    const wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.json({ reply: "❌ Business wallet missing" });
    }

    /* ===============================
       🛍 SHOW PRODUCTS
       =============================== */
    if (message === "show products") {
      const products = await Product.find({ business: business._id });

      if (!products.length) {
        return res.json({ reply: "❌ No products available" });
      }

      let reply = `🛒 Available Products – ${business.name}\n\n`;

      products.forEach((p, i) => {
        reply += `${i + 1}. ${p.name} – KES ${p.price}\n`;
      });

      reply += `\nReply:\nbuy <product> <qty>\nExample: buy sugar 2`;

      return res.json({ reply });
    }

    /* ===============================
       💳 PAY (MARK ORDER AS PAID + RECEIPT)
       =============================== */
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({ reply: "❌ No pending order" });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.json({ reply: "❌ Order not found" });
      }

      if (order.status === "PAID") {
        return res.json({ reply: "✅ Order already paid" });
      }

      order.status = "PAID";
      order.paidAt = new Date();
      await order.save();

      delete lastOrderBySender[sender];

      /* 🧾 BUILD RECEIPT (ADDED ONLY) */
      let receipt = `🧾 RECEIPT\n\n`;
      receipt += `${business.name}\n`;
      receipt += `----------------------\n`;

      for (const item of order.items) {
        const p = await Product.findById(item.product);
        receipt += `${p.name} × ${item.quantity}\n`;
      }

      receipt += `\nTotal: KES ${order.total}\n`;
      receipt += `Status: PAID\n`;
      receipt += `Date: ${order.paidAt.toLocaleString()}\n\n`;
      receipt += `Thank you for your purchase 🙏`;

      return res.json({ reply: receipt });
    }

    /* ===============================
       🛒 BUY
       =============================== */
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
