const express = require("express");
const jwt = require("jsonwebtoken");

const Product = require("../models/Product");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Business = require("../models/Business");

const router = express.Router();

/**
 * 🔒 HARD-BINDED BUSINESS (MVP)
 * One WhatsApp number = One Business
 */
const BUSINESS_ID = "6977a75f31747055b1f1f60b";

// In-memory session (MVP)
const lastOrderBySender = {};

/**
 * INTERNAL SERVICE TOKEN (Smart Connect → Smart Biz)
 */
function getServiceToken() {
  return jwt.sign(
    { id: BUSINESS_ID },
    process.env.JWT_SECRET || "navuSmartBizSecretKey2025",
    { expiresIn: "5m" }
  );
}

/* =========================
   WHATSAPP MESSAGE HANDLER
   ========================= */
router.post("/message", async (req, res) => {
  try {
    const { text, sender } = req.body;

    if (!text || !sender) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    // 1️⃣ Load business
    const business = await Business.findById(BUSINESS_ID);
    if (!business) {
      return res.json({ reply: "❌ Business not configured" });
    }

    // 2️⃣ Ensure business wallet exists
    let wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      wallet = await Wallet.create({
        owner: business._id,
        ownerType: "BUSINESS",
        balance: 0,
        currency: "KES"
      });
    }

    /**
     * PAY COMMAND
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
          "💳 Payment initiated.\n" +
          "Complete payment on your phone.",
        orderId
      });
    }

    /**
     * BUY COMMAND
     */
    const parts = message.split(/\s+/);
    if (parts[0] !== "buy") {
      return res.json({
        reply: "❌ Use: Buy <product> <qty>"
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

    /**
     * CREATE ORDER IN SMART BIZ
     */
    const response = await fetch(
      `${process.env.SMART_BIZ_URL}/api/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getServiceToken()}`
        },
        body: JSON.stringify({
          business: business._id,
          items: [
            {
              product: product._id,
              quantity: qty
            }
          ],
          total
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create order in Smart Biz");
    }

    const order = await response.json();
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
    console.error("❌ WhatsApp Order Error:", err.message);
    return res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = router;
