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
 * 🧪 DEBUG ROUTE
 */
router.get("/orders/__ping", (req, res) => {
  res.json({
    ok: true,
    route: "internal.orders",
    time: new Date().toISOString()
  });
});

/**
 * 💰 WALLET PAYMENT
 */
async function handleWalletPayment(order) {
  const Wallet = require("../models/Wallet");

  const wallet = await Wallet.findOne({
    owner: order.business,
    ownerType: "BUSINESS"
  });

  if (!wallet) {
    throw new Error("Business wallet not found");
  }

  if (wallet.balance < order.total) {
    return { paid: false, reason: "INSUFFICIENT_FUNDS" };
  }

  wallet.balance -= order.total;
  await wallet.save();

  order.status = "PAID";
  order.paidAt = new Date();
  order.paymentMethod = "WALLET";

  await order.save();

  return {
    paid: true,
    balance: wallet.balance
  };
}

/**
 * 🛒 CREATE ORDER + AUTO PAYMENT
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
      total,
      status: "UNPAID",
      customerPhone: "254700000001",
      customerUserId: business,
      businessWalletId: business,
      items: items.map(item => ({
        product: item.productId,
        qty: item.qty
      })),
      createdAt: new Date()
    });

    await order.save();

    // 💰 PAYMENT
    const payment = await handleWalletPayment(order);

    if (!payment.paid) {
      return res.json({
        success: true,
        order,
        payment: {
          status: "FAILED",
          reason: payment.reason
        }
      });
    }

    console.log("🛒 ORDER + PAYMENT SUCCESS:", order._id.toString());

    return res.json({
      success: true,
      order,
      payment: {
        status: "PAID",
        remainingBalance: payment.balance
      }
    });

  } catch (err) {
    return res.json({
      error: err.message,
      details: err.errors || null
    });
  }
});

module.exports = router;
