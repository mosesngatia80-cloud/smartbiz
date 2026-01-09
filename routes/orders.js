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
    // ✅ CORRECT USER ID FROM JWT
    const userId = req.user.user;

    // 1️⃣ Find business owned by this user
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
 * MARK ORDER AS PAID (Smart Pay)
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
      const existingReceipt = await Receipt.findOne({ orderId: order._id });

      if (!existingReceipt) {
        await Receipt.create({
          receiptId: `RCT-${Date.now()}`,
          orderId: order._id,
          transactionId: new mongoose.Types.ObjectId(),
          businessId: order.business,
          customerId: order.customerUserId,
          customerPhone: order.customerPhone,
          amount: order.total,
          paymentMethod: "M-PESA",
          status: "ISSUED"
        });
      }

      return res.json({ success: true });
    }

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
      paymentMethod: "M-PESA",
      status: "ISSUED"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Mark paid error:", err);
    res.status(500).json({ message: "Failed to mark order paid" });
  }
});

/**
 * 🔁 REFUND ORDER
 */
router.post("/:orderId/refund", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "PAID") {
      return res.status(400).json({
        message: "Only PAID orders can be refunded"
      });
    }

    if (order.refundedAt) {
      return res.json({
        success: true,
        message: "Order already refunded"
      });
    }

    const businessWallet = await Wallet.findOne({
      owner: order.business,
      ownerType: "BUSINESS"
    });

    const userWallet = await Wallet.findOne({
      owner: order.customerUserId,
      ownerType: "USER"
    });

    if (!businessWallet || !userWallet) {
      return res.status(500).json({
        message: "Wallets not found for refund"
      });
    }

    const amount = order.total;

    if (businessWallet.balance < amount) {
      return res.status(400).json({
        message: "Insufficient business balance for refund"
      });
    }

    businessWallet.balance -= amount;
    userWallet.balance += amount;

    await businessWallet.save();
    await userWallet.save();

    await Transaction.create({
      from: businessWallet.owner,
      to: userWallet.owner,
      amount,
      type: "REFUND",
      reference: `RFD-${Date.now()}`,
      orderId: order._id
    });

    await Receipt.updateOne(
      { orderId: order._id },
      { status: "REFUNDED" }
    );

    order.status = "REFUNDED";
    order.refundedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Refund successful",
      orderId: order._id
    });
  } catch (err) {
    console.error("❌ Refund error:", err);
    res.status(500).json({
      message: "Refund failed",
      error: err.message
    });
  }
});

module.exports = router;
