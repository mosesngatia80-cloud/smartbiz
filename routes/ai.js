const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const Product = require("../models/Product");
const Order = require("../models/Order");
const Sale = require("../models/Sale"); // ✅ ADDED
const Customer = require("../models/Customer");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

router.post("/", auth, async (req, res) => {
  try {
    const text = (req.body.message || "").toLowerCase().trim();
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {
      return res.status(400).json({ message: "Business wallet missing" });
    }

    /* ================= ADD PRODUCT ================= */
    if (text.startsWith("add product")) {
      const parts = text.replace("add product", "").trim().split(" ");
      const price = Number(parts.pop());
      const name = parts.join(" ");

      if (!name || !price) {
        return res.status(400).json({ message: "Invalid product command" });
      }

      const product = await Product.create({
        name,
        price,
        owner: userId,
        business: business._id
      });

      return res.json({ action: "ADD_PRODUCT", product });
    }

    /* ================= SELL (AI POS) ================= */
    if (text.startsWith("sell")) {
      const parts = text.replace("sell", "").trim().split(" ");
      const qty = Number(parts.pop());
      const name = parts.join(" ");

      if (!name || !qty || qty <= 0) {
        return res.status(400).json({ message: "Invalid sell command" });
      }

      const product = await Product.findOne({
        name: new RegExp(`^${name}$`, "i"),
        business: business._id
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const lineTotal = product.price * qty;

      // ✅ ORDER (already working)
      const order = await Order.create({
        business: business._id,
        businessWalletId: wallet._id,

        customerUserId: userId,
        customerPhone: "POS-WALKIN",

        items: [
          {
            product: product._id,
            name: product.name,
            price: product.price,
            qty,
            lineTotal
          }
        ],

        total: lineTotal,
        status: "PAID",
        paidAt: new Date()
      });

      // ✅ SALE (THIS FIXES DASHBOARD & SALES TAB)
      const sale = await Sale.create({
        business: business._id,
        owner: userId,
        amount: lineTotal,
        source: "AI",
        orderId: order._id
      });

      return res.json({
        action: "SELL",
        orderId: order._id,
        saleId: sale._id,
        total: lineTotal
      });
    }

    /* ================= ADD CUSTOMER ================= */
    if (text.startsWith("add customer")) {
      const parts = text.replace("add customer", "").trim().split(" ");
      const phone = parts.pop();
      const name = parts.join(" ");

      if (!name || !phone) {
        return res.status(400).json({ message: "Invalid customer command" });
      }

      const customer = await Customer.create({
        name,
        phone,
        owner: userId,
        business: business._id
      });

      return res.json({ action: "ADD_CUSTOMER", customer });
    }

    return res.status(400).json({ message: "Unknown AI command" });

  } catch (err) {
    console.error("AI error FULL:", err);
    res.status(500).json({ message: "AI execution failed" });
  }
});

module.exports = router;
