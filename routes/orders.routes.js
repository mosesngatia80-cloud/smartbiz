const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Business = require("../models/Business");

const router = express.Router();

/**
 * INTERNAL AUTH (Smart Connect → Smart Biz)
 */
function smartConnectAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing service token" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "navuSmartBizSecretKey2025"
    );

    req.ownerId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid service token" });
  }
}

/**
 * ✅ LIST ORDERS FOR LOGGED-IN BUSINESS (FRONTEND)
 * Used by: Dashboard, Sales, Orders, Customers
 */
router.get("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "navuSmartBizSecretKey2025"
    );

    const ownerId = decoded.id;

    const business = await Business.findOne({ owner: ownerId });
    if (!business) {
      return res.json([]);
    }

    const orders = await Order.find({ business: business._id })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/**
 * CREATE ORDER
 */
router.post("/", smartConnectAuth, async (req, res) => {
  try {
    const { business, items, total } = req.body;

    if (!business || !items || !items.length || !total) {
      return res.status(400).json({ message: "Invalid order payload" });
    }

    const order = await Order.create({
      owner: req.ownerId,
      business,
      items,
      total,
      paymentMethod: "cash",
      status: "pending"
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ message: "Failed to create order" });
  }
});

/**
 * 📋 LIST PAID ORDERS FOR BUSINESS (DASHBOARD)
 */
router.get("/business/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;

    const orders = await Order.find({
      business: businessId,
      status: "paid"
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/**
 * VERIFY ORDER (Smart Pay → Smart Biz)
 */
router.get("/:orderId/verify", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.json({ valid: false });
    }

    if (order.status !== "pending") {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      amount: order.total,
      status: order.status
    });
  } catch (err) {
    console.error("Verify order error:", err.message);
    res.status(500).json({ valid: false });
  }
});

/**
 * MARK ORDER AS PAID (Smart Pay → Smart Biz)
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

    if (order.status === "paid") {
      return res.json({ success: true });
    }

    order.status = "paid";
    order.paymentRef = paymentRef;
    await order.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Mark paid error:", err.message);
    res.status(500).json({ message: "Failed to mark order paid" });
  }
});

module.exports = router;
