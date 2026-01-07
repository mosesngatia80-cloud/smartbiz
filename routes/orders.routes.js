const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");

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

module.exports = router;
