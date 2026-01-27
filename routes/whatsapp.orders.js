const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");
const Sale = require("../models/Sale");
const Wallet = require("../models/Wallet");
const Business = require("../models/Business");

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
    // PAY COMMAND (REAL PAYMENT LOGIC)
    // =====================
    if (message === "pay") {
      const orderId = lastOrderBySender[sender];

      if (!orderId) {
        return res.json({
          reply: "❌ No pending order found. Send: Buy <product> <qty>",
        });
      }

      const order = await Order.findById(orderId);
      if (!order || order.status === "PAID") {
        return res.json({ reply: "⚠️ Order already paid or invalid." });
      }

      const business = await Business.findById(order.business);
      const wallet = await Wallet.findOne({
        owner: business._id,
        ownerType: "BUSINESS",
      });

      if (!wallet) {
        return res.json({ reply: "❌ Business wallet not found." });
      }

      // ✅ Mark order as PAID
      order.status = "PAID";
      order.paidAt = new Date();
      await order.save();

      // ✅ Create Sale
      await Sale.create({
        business: business._id,
        owner: business.owner,
        amount: order.total,
        source: "WHATSAPP",
        orderId: order._id,
      });

      // ✅ Credit wallet
      wallet.balance += order.total;
      await wallet.save();

      delete lastOrderBySender[sender];

      return res.json({
        reply:
          `✅ Payment successful!\n\n` +
          `Order ID: ${order._id}\n` +
          `Amount: KES ${order.total}\n\n` +
          `💼 New Wallet Balance: KES ${wallet.balance}`,
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
      return res.json({ reply: "❌ Product unavailable" });
    }

    const order = await Order.create({
      owner: product.owner,
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
      status: "PENDING",
      paymentMethod: "WALLET",
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
    console.error("WhatsApp error:", err.message);
    res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
