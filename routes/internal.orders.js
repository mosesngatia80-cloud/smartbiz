const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");

/* 🔥 SERVICE LAYER */
const { createOrder, markOrderPaid } = require("../services/order.service");

/**
 * INTERNAL AUTH
 */
function internalAuth(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.CT_INTERNAL_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/**
 * CREATE ORDER + AUTO PAYMENT (UPDATED)
 */
router.post("/orders", internalAuth, async (req, res) => {

  try {

    const { business, items } = req.body;

    if (!business || !items || !items.length) {
      return res.status(400).json({ message: "Invalid data" });
    }

    let total = 0;

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

    /* 🔥 CREATE VIA SERVICE */
    const order = await createOrder({
      business,
      total,
      status: "UNPAID",
      customerPhone: "254700000001",
      items: items.map(i => ({
        product: i.productId,
        qty: i.qty
      }))
    });

    /* 💰 AUTO MARK PAID */
    order.status = "PAID";
    order.paidAt = new Date();
    await order.save();

    return res.json({
      success: true,
      order,
      payment: {
        status: "PAID"
      }
    });

  } catch (err) {
    return res.json({
      error: err.message
    });
  }
});

module.exports = router;
