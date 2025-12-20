const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/authMiddleware").default;

/**
 * CREATE ORDER
 */
router.post("/", auth, async (req, res) => {
  try {
    const { business, items, totalAmount } = req.body;

    const order = await Order.create({
      business,
      items,
      totalAmount,
      createdBy: req.user.id
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET ORDERS FOR A BUSINESS
 */
router.get("/business/:businessId", auth, async (req, res) => {
  try {
    const orders = await Order.find({
      business: req.params.businessId
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * UPDATE ORDER (BLOCK IF PAID)
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "PAID") {
      return res
        .status(403)
        .json({ message: "Paid orders cannot be modified" });
    }

    Object.assign(order, req.body);
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * MARK ORDER AS PAID
 */
router.post("/:id/mark-paid", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    order.paymentStatus = "PAID";
    order.paidAt = new Date();

    await order.save();

    res.json({
      message: "Order marked as paid",
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
