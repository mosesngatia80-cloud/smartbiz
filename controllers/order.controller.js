import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Business from "../models/Business.js";
import fetch from "node-fetch";

const SMART_PAY_BASE = "https://afri-smart-pay-4.onrender.com";

/**
 * 🧾 CREATE ORDER
 */
export const createOrder = async (req, res) => {
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
export const markOrderPaid = async (req, res) => {
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

      // Normalize phone (0706... → 254706...)
      let phone = business.phone;
      if (phone.startsWith("0")) {
        phone = "254" + phone.slice(1);
      }

      // 🔁 SELF-TRANSFER (TEST MODE)
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

    res.json(order);
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Payment processing failed" });
  }
};

export const getOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
};
