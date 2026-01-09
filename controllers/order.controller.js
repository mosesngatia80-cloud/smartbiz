const Order = require("../models/Order.js");
const Product = require("../models/Product.js");
const Business = require("../models/Business.js");
const Receipt = require("../models/Receipt.js");
const Transaction = require("../models/Transaction.js");
const fetch = require("node-fetch");

const SMART_PAY_BASE = "https://afri-smart-pay-4.onrender.com";

/**
 * 🧾 CREATE ORDER
 */
exports.createOrder = async (req, res) => {
  try {
    const { business, items, paymentMethod } = req.body;

    if (!business || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const total = product.price * item.quantity;
      subtotal += total;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total
      });
    }

    const order = await Order.create({
      business,
      items: orderItems,
      subtotal,
      tax: 0,
      totalAmount: subtotal,
      paymentMethod,
      paymentStatus: "PENDING",
      status: "OPEN"
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 💳 PAY ORDER (SMART PAY WALLET DEBIT)
 */
exports.markOrderPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔒 Prevent double payment
    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // 💰 WALLET PAYMENT
    if (order.paymentMethod === "WALLET") {
      const business = await Business.findById(order.business);
      if (!business || !business.phone) {
        return res.status(400).json({ message: "Business phone not found" });
      }

      let phone = business.phone;
      if (phone.startsWith("0")) {
        phone = "254" + phone.slice(1);
      }

      const payRes = await fetch(`${SMART_PAY_BASE}/api/send-money`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: phone,
          to: phone,
          amount: order.totalAmount
        })
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        return res.status(400).json({
          message: "Wallet debit failed",
          error: payData
        });
      }
    }

    // ✅ Mark order paid
    order.paymentStatus = "PAID";
    order.status = "COMPLETED";
    await order.save();

    // ================================
    // 🧾 AUTO-ISSUE RECEIPT (IDEMPOTENT)
    // ================================
    const existingReceipt = await Receipt.findOne({
      orderId: order._id
    });

    if (!existingReceipt) {
      const transaction = await Transaction.findOne({
        orderId: order._id,
        status: "SUCCESS"
      });

      await Receipt.create({
        receiptId: `RCT-${Date.now()}`,
        orderId: order._id,
        transactionId: transaction ? transaction._id : null,
        businessId: order.business,
        customerId: order.customer || null,
        customerPhone: order.customerPhone || "",
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod
      });
    }

    res.json(order);
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Payment processing failed" });
  }
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
};
