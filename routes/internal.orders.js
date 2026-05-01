const express = require("express");

/* 🔎 DEBUG: CONFIRM FILE IS LOADED */
console.log("✅ internal.orders.js LOADED");

const router = express.Router();
const Order = require("../models/Order");

/**
 * 🧪 DEBUG ROUTE — CONFIRM ROUTE IS MOUNTED
 */
router.get("/orders/__ping", (req, res) => {
  res.json({
    ok: true,
    route: "internal.orders",
    time: new Date().toISOString()
  });
});

/**
 * 🔐 INTERNAL AUTH (SMART CONNECT → SMART BIZ)
 */
function internalAuth(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.CT_INTERNAL_KEY) {
    return res.status(401).json({ message: "Unauthorized internal call" });
  }
  next();
}

/**
 * ✅ MARK ORDER AS PAID (EXISTING)
 */
router.post("/orders/mark-paid", internalAuth, async (req, res) => {
  try {
    const { orderId, paymentRef } = req.body;

    if (!orderId || !paymentRef) {
      return res.status(400).json({
        message: "orderId and paymentRef required"
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "paid" || order.status === "PAID") {
      return res.json({ success: true });
    }

    order.status = "PAID";
    order.paymentRef = paymentRef;
    order.paidAt = new Date();
    await order.save();

    console.log("✅ ORDER AUTO-MARKED PAID:", order._id.toString());

    res.json({ success: true });
  } catch (err) {
    console.error("❌ INTERNAL ORDER MARK ERROR:", err.message);
    res.status(500).json({ message: "Internal order update failed" });
  }
});

/**
 * 🛒 CREATE ORDER (NEW - THIS IS WHAT WAS MISSING)
 */
router.post("/orders", internalAuth, async (req, res) => {
  try {
    const { business, items } = req.body;

    if (!business || !items || !items.length) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    let total = 0;
    const Product = require("../models/Product");

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      total += product.price * item.qty;

      product.stock -= item.qty;
      await product.save();
    }

    const order = new Order({
      business,
      items,
      total,
      status: "PENDING"
    });

    await order.save();

    console.log("🛒 INTERNAL ORDER CREATED:", order._id.toString());

    res.json(order);

  } catch (err) {
    console.error("❌ INTERNAL ORDER CREATE ERROR:", err.message);
    res.status(500).json({ message: "Order creation failed" });
  }
});

module.exports = router;
