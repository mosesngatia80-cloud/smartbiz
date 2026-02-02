const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Business = require("../models/Business");

const router = express.Router();

/**
 * 🔐 AUTH FOR FRONTEND (DASHBOARD)
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "navuSmartBizSecretKey2025"
    );
    req.userId = decoded.user || decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * 📋 GET ALL ORDERS FOR LOGGED-IN BUSINESS (FRONTEND)
 */
router.get("/", auth, async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.userId });
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
 * CREATE ORDER (INTERNAL)
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
 * VERIFY ORDER
 */
router.get("/:orderId/verify", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order || order.status !== "pending") {
      return res.json({ valid: false });
    }

    res.json({ valid: true, amount: order.total });
  } catch {
    res.json({ valid: false });
  }
});

/**
 * MARK ORDER AS PAID
 */
router.post("/:orderId/mark-paid", async (req, res) => {
  try {
    const { paymentRef } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Not found" });

    order.status = "paid";
    order.paymentRef = paymentRef;
    await order.save();

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
});

module.exports = router;
