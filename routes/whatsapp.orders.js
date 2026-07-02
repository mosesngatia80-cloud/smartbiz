const express = require("express");
const router = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const Wallet   = require("../models/Wallet");
const Business = require("../models/Business");
const BusinessWhatsApp = require("../models/BusinessWhatsApp");
const ConversationSession =
  require("../models/ConversationSession");

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

    if (!sender || !text) {
      return res.json({ reply: "⚠️ Invalid message format" });
    }

    const message = text.trim().toLowerCase();

    /* =========================
       SHARED NAVU GATEWAY
    ========================= */

    if (!businessNumber) {

      let session =
        await ConversationSession.findOne({
          sender,
          status: "ACTIVE"
        });

      if (!session) {

        const business =
          await Business.findOne({
            slug: message
          });

        if (!business) {
          return res.json({
            reply:
              "❌ Business not found. Send the business store code."
          });
        }

        await ConversationSession.findOneAndUpdate(
          { sender },
          {
            sender,
            business: business._id,
            businessSlug: business.slug,
            status: "ACTIVE",
            lastActivity: new Date()
          },
          {
            upsert: true,
            new: true
          }
        );

        return res.json({
          reply:
            "🏪 Welcome to " +
            business.name +
            "\n\nNow send:\n\nbuy rice 2"
        });
      }

      const linkedBusiness =
        await Business.findById(session.business);

      if (!linkedBusiness) {
        return res.json({
          reply: "❌ Business session expired."
        });
      }
    }

    let business;

    if (businessNumber) {

      const linked = await BusinessWhatsApp.findOne({
        whatsappNumber: businessNumber,
        active: true
      });

      if (!linked) {
        return res.json({
          reply: "❌ Business not linked"
        });
      }

      business = await Business.findById(linked.business);

    } else {

      const session =
        await ConversationSession.findOne({
          sender,
          status: "ACTIVE"
        });

      if (!session) {
        return res.json({
          reply: "❌ No active shopping session. Send the business store code first."
        });
      }

      business =
        await Business.findById(session.business);
    }

    if (!business) {
      return res.json({
        reply: "❌ Business not found"
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

    /* =========================
       GREETING / MENU
    ========================= */

    if (
      message === "hi" ||
      message === "hello" ||
      message === "menu" ||
      message === "products"
    ) {

      const products = await Product.find({
        business: business._id
      }).sort({ name: 1 });

      if (!products.length) {
        return res.json({
          reply: "⚠️ No products available."
        });
      }

      let reply =
        `🏪 Welcome to ${business.name}\n\n` +
        `🛒 Available Products\n\n`;

      products.forEach((p, i) => {
        reply += `${i + 1}. ${p.name} - KES ${p.price}\n`;
      });

      reply +=
        `\nReply:\n` +
        `buy product-name quantity\n\n` +
        `Example:\n` +
        `buy sugar 2`;

      return res.json({ reply });
    }

    const parts = message.split(/\s+/);

    if (parts[0] !== "buy") {
      return res.json({
        reply: "Type:\n\nhi\nor\nmenu\n\nto see available products."
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
