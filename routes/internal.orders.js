const express = require("express");

/* 🔎 DEBUG: CONFIRM FILE IS LOADED */
console.log("✅ internal.orders.js LOADED");

const router = express.Router();
const Order = require("../models/Order");

/**
 * 🔐 INTERNAL AUTH
 */
function internalAuth(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.CT_INTERNAL_KEY) {
    return res.status(401).json({ message: "Unauthorized internal call" });
  }
  next();
}

/**
 * 🛒 CREATE ORDER (DEBUG VERSION)
 */
router.post("/orders", internalAuth, async (req, res) => {
  try {
    const { business, items } = req.body;

    let total = 0;
    const Product = require("../models/Product");

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.json({ error: "Product not found" });
      }

      if (product.stock < item.qty) {
        return res.json({ error: "Insufficient stock" });
      }

      total += product.price * item.qty;

      product.stock -= item.qty;
      await product.save();
    }

    const order = new Order({
      business,
      items,
      total,
      status: "PENDING",
      owner: business,
      createdAt: new Date()
    });

    await order.save();

    return res.json({ success: true, order });

  } catch (err) {
    // 🔥 FULL ERROR RETURN
    return res.json({
      error: err.message,
      details: err.errors || null,
      stack: err.stack
    });
  }
});

module.exports = router;
