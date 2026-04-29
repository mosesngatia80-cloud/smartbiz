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
 * ✅ VERIFY ORDER (READ-ONLY)
 * Used by Smart Pay before payment
 */
router.get("/:orderId/verify", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.json({ valid: false });
    }

    if (order.status !== "UNPAID") {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      amount: order.total,
      businessWalletId: order.businessWalletId,
      status: order.status
    });
  } catch (err) {
    console.error("❌ Verify order error:", err.message);
    res.status(500).json({ valid: false });
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

/**
 * 💵 CREATE MANUAL SALE (CASH / WALLET)
 * No WhatsApp, no products required
 */
router.post("/manual", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business || !business.walletId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const { amount, paymentMethod } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const order = await Order.create({
      business: business._id,
      businessWalletId: business.walletId,
      customerPhone: "MANUAL",
      customerUserId: userId,
      items: [],
      total: Number(amount),
      status: paymentMethod === "CASH" ? "PAID" : "UNPAID",
      paymentMethod: paymentMethod || "CASH",
      source: "MANUAL"
    });

    // 💳 WALLET → use existing mark-paid flow
    if (paymentMethod === "WALLET") {
      req.params.orderId = order._id;
      req.body.paymentRef = "WALLET-MANUAL";

      return router.handle(req, res, () => {});
    }

    // 💵 CASH → already paid, just log
    if (paymentMethod === "CASH") {
      console.log("💵 Manual cash sale:", amount);
    }

    res.status(201).json(order);

  } catch (err) {
    console.error("❌ Manual sale error:", err);
    res.status(500).json({ message: err.message });
  }
});


/**
 * 📊 SALES SUMMARY (DASHBOARD)
 */
router.get("/summary", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const orders = await Order.find({
      business: business._id,
      status: "PAID"
    });

    let total = 0;
    let cash = 0;
    let wallet = 0;
    let mpesa = 0;

    orders.forEach(o => {
      total += o.total;

      if (o.paymentMethod === "CASH") cash += o.total;
      if (o.paymentMethod === "WALLET") wallet += o.total;
      if (o.paymentMethod === "MPESA") mpesa += o.total;
    });

    res.json({
      total,
      breakdown: {
        CASH: cash,
        WALLET: wallet,
        MPESA: mpesa
      }
    });

  } catch (err) {
    console.error("❌ Summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
});


// ================= FIX ROUTE PRIORITY =================

// re-declare summary BEFORE param route
router.get("/__summary_fix", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const orders = await Order.find({
      business: business._id,
      status: "PAID"
    });

    let total = 0;
    let cash = 0;
    let wallet = 0;
    let mpesa = 0;

    orders.forEach(o => {
      total += o.total;

      if (o.paymentMethod === "CASH") cash += o.total;
      if (o.paymentMethod === "WALLET") wallet += o.total;
      if (o.paymentMethod === "MPESA") mpesa += o.total;
    });

    res.json({
      total,
      breakdown: {
        CASH: cash,
        WALLET: wallet,
        MPESA: mpesa
      }
    });

  } catch (err) {
    console.error("❌ Summary fix error:", err);
    res.status(500).json({ message: "Summary failed" });
  }
});


// ================= SAFE SUMMARY ROUTE =================
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const orders = await Order.find({
      business: business._id,
      status: "PAID"
    });

    let total = 0;
    let cash = 0;
    let wallet = 0;
    let mpesa = 0;

    orders.forEach(o => {
      total += o.total;

      if (o.paymentMethod === "CASH") cash += o.total;
      if (o.paymentMethod === "WALLET") wallet += o.total;
      if (o.paymentMethod === "MPESA") mpesa += o.total;
    });

    res.json({
      total,
      breakdown: {
        CASH: cash,
        WALLET: wallet,
        MPESA: mpesa
      }
    });

  } catch (err) {
    console.error("❌ Summary error:", err);
    res.status(500).json({ message: "Summary failed" });
  }
});


// ================= PATCH SUMMARY LOGIC =================
router.get("/stats/summary-v2", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    const orders = await Order.find({
      business: business._id,
      status: "PAID"
    });

    let total = 0;
    let cash = 0;
    let wallet = 0;
    let mpesa = 0;

    orders.forEach(o => {
      total += o.total;

      // 🔥 fallback logic
      const method = o.paymentMethod || "MPESA";

      if (method === "CASH") cash += o.total;
      if (method === "WALLET") wallet += o.total;
      if (method === "MPESA") mpesa += o.total;
    });

    res.json({
      total,
      breakdown: {
        CASH: cash,
        WALLET: wallet,
        MPESA: mpesa
      }
    });

  } catch (err) {
    console.error("❌ Summary v2 error:", err);
    res.status(500).json({ message: "Summary failed" });
  }
});


// ================= FIX CASE SENSITIVE SUMMARY =================
router.get("/stats/summary-final", auth, async (req, res) => {
  try {
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });

    const orders = await Order.find({
      business: business._id,
      status: "PAID"
    });

    let total = 0;
    let cash = 0;
    let wallet = 0;
    let mpesa = 0;

    orders.forEach(o => {
      total += o.total;

      const method = (o.paymentMethod || "MPESA").toUpperCase();

      if (method === "CASH") cash += o.total;
      else if (method === "WALLET") wallet += o.total;
      else mpesa += o.total;
    });

    res.json({
      total,
      breakdown: {
        CASH: cash,
        WALLET: wallet,
        MPESA: mpesa
      }
    });

  } catch (err) {
    console.error("❌ Final summary error:", err);
    res.status(500).json({ message: "Summary failed" });
  }
});


// ================= HARD DEBUG SUMMARY =================
router.get("/stats/summary-debug-final", auth, async (req, res) => {
  const userId = req.user.user;
  const business = await Business.findOne({ owner: userId });

  const orders = await Order.find({ business: business._id });

  const result = orders.map(o => ({
    total: o.total,
    paymentMethod: o.paymentMethod,
    status: o.status
  }));

  res.json({
    raw: result
  });
});


// ================= FINAL SMART SUMMARY =================
router.get("/stats/summary-final-v2", auth, async (req, res) => {
  try {
    const userId = req.user.user;
    const business = await Business.findOne({ owner: userId });

    const orders = await Order.find({
      business: business._id,
      status: "PAID"
    });

    let total = 0;
    let cash = 0;
    let wallet = 0;
    let mpesa = 0;

    orders.forEach(o => {
      total += o.total;

      // 🔥 SMART LOGIC
      if (o.paymentMethod) {
        const method = o.paymentMethod.trim().toUpperCase();

        if (method === "CASH") cash += o.total;
        else if (method === "WALLET") wallet += o.total;
        else mpesa += o.total;

      } else {
        // 🔥 OLD DATA → treat as CASH (based on your system history)
        cash += o.total;
      }
    });

    res.json({
      total,
      breakdown: {
        CASH: cash,
        WALLET: wallet,
        MPESA: mpesa
      }
    });

  } catch (err) {
    console.error("❌ Final v2 error:", err);
    res.status(500).json({ message: "Summary failed" });
  }
});

