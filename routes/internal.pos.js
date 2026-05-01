const express = require("express");
const router = express.Router();

/* 🔐 INTERNAL AUTH */
function internalAuth(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.CT_INTERNAL_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/* 🛒 POS SELL (CASH WALK-IN) */
router.post("/pos/sell", internalAuth, async (req, res) => {
  try {
    let { business, productId, qty } = req.body;

    qty = Number(qty);

    if (!business || !productId || !qty || qty <= 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const Product = require("../models/Product");
    const Order = require("../models/Order");
    const Wallet = require("../models/Wallet");

    /* 🔍 GET PRODUCT */
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const total = product.price * qty;

    /* 🔻 REDUCE STOCK */
    product.stock -= qty;
    await product.save();

    /* 💼 GET OR CREATE WALLET */
    let wallet = await Wallet.findOne({
      owner: business,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      wallet = new Wallet({
        owner: business,
        ownerType: "BUSINESS",
        balance: 0
      });
    }

    /* ➕ ADD CASH */
    wallet.balance += total;
    await wallet.save();

    /* 🧾 CREATE ORDER */
    const order = new Order({
      business,
      total,
      status: "PAID",
      paymentMethod: "CASH",
      customerPhone: "WALK-IN",
      customerUserId: business,
      businessWalletId: business,
      items: [
        {
          product: product._id,
          qty
        }
      ],
      source: "POS",
      createdAt: new Date()
    });

    await order.save();

    console.log("🛒 POS SALE:", order._id.toString());

    return res.json({
      success: true,
      order,
      balance: wallet.balance
    });

  } catch (err) {
    console.error("❌ POS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
