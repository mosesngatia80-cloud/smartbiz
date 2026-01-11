const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Business = require("../models/Business");
const Receipt = require("../models/Receipt");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

/**
 * CREATE ORDER (USER / DASHBOARD FLOW)
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business || !business.walletId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const { customerPhone, items } = req.body;
    if (!customerPhone || !items || !items.length) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        business: business._id
      });

      if (!product) {
        return res.status(404).json({
          message: "Product not found for this business"
        });
      }

      const qty = Number(item.qty);
      const lineTotal = product.price * qty;
      total += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty,
        lineTotal
      });
    }

    const order = await Order.create({
      business: business._id,
      businessWalletId: business.walletId,
      customerPhone,
      customerUserId: userId,
      items: orderItems,
      total,
      status: "UNPAID"
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET ALL ORDERS (DASHBOARD)
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.user;
    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const orders = await Order.find({ business: business._id })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Get orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/**
 * GET SINGLE ORDER BY ID (READ-ONLY)
 */
router.get("/:orderId", auth, async (req, res) => {
  try {
    const userId = req.user.user;
    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      business: business._id
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("❌ Get order error:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

/**
 * MARK ORDER AS PAID (Smart Pay) + 💰 SETTLEMENT
 */
router.post("/:orderId/mark-paid", async (req, res) => {
  try {
    const { paymentRef } = req.body;
    if (!paymentRef) {
      return res.status(400).json({ message: "Payment reference required" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "PAID") {
      return res.json({ success: true });
    }

    const businessWallet = await Wallet.findOne({
      owner: order.business,
      ownerType: "BUSINESS"
    });

    if (!businessWallet) {
      return res.status(500).json({ message: "Business wallet not found" });
    }

    if (businessWallet.balance < order.total) {
      return res.status(400).json({
        message: "Insufficient business balance for settlement"
      });
    }

    businessWallet.balance -= order.total;
    await businessWallet.save();

    await Transaction.create({
      from: businessWallet.owner,
      to: order.customerUserId,
      amount: order.total,
      type: "SALE",
      reference: paymentRef,
      orderId: order._id
    });

    order.status = "PAID";
    order.paymentRef = paymentRef;
    order.paidAt = new Date();
    await order.save();

    await Receipt.create({
      receiptId: `RCT-${Date.now()}`,
      orderId: order._id,
      transactionId: new mongoose.Types.ObjectId(),
      businessId: order.business,
      customerId: order.customerUserId,
      customerPhone: order.customerPhone,
      amount: order.total,
      currency: "KES",
      paymentMethod: "M-PESA",
      status: "ISSUED"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Mark paid error:", err);
    res.status(500).json({ message: "Failed to mark order paid" });
  }
});

module.exports = router;
