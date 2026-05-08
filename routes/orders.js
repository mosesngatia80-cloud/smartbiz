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

      if (product.stock < qty) {
        return res.status(400).json({
          message: `${product.name} is out of stock`
        });
      }

      product.stock -= qty;
      await product.save();

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
      status: "UNPAID",
      paymentMethod: "CASH",
      source: "WHATSAPP"
    });

    res.status(201).json(order);

  } catch (err) {

    console.error(
      "❌ Create order error:",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
});

/**
 * GET ALL ORDERS (WHATSAPP SAFE VERSION)
 */
router.get("/", async (req, res) => {

  try {

    const whatsappNumber =
      req.query.whatsappNumber;

    if (!whatsappNumber) {

      return res.status(400).json({
        message: "WhatsApp number required"
      });
    }

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {

      return res.status(404).json({
        message: "Business not found"
      });
    }

    const orders =
      await Order.find({
        business: business._id
      })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    console.error(
      "❌ Get orders error:",
      err
    );

    res.status(500).json({
      message: "Failed to fetch orders"
    });
  }
});

/**
 * VERIFY ORDER
 */
router.get("/:orderId/verify", async (req, res) => {

  try {

    const order =
      await Order.findById(
        req.params.orderId
      );

    if (
      !order ||
      order.status !== "UNPAID"
    ) {

      return res.json({
        valid: false
      });
    }

    res.json({
      valid: true,
      amount: order.total,
      businessWalletId:
        order.businessWalletId,
      status: order.status
    });

  } catch (err) {

    res.status(500).json({
      valid: false
    });
  }
});

/**
 * MARK ORDER AS PAID
 */
router.post("/:orderId/mark-paid", async (req, res) => {

  try {

    const { paymentRef } =
      req.body;

    const order =
      await Order.findById(
        req.params.orderId
      );

    if (!order) {

      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status === "PAID") {

      return res.json({
        success: true
      });
    }

    const wallet =
      await Wallet.findOne({
        owner: order.business,
        ownerType: "BUSINESS"
      });

    if (!wallet) {

      return res.status(500).json({
        message: "Wallet not found"
      });
    }

    if (
      wallet.balance <
      order.total
    ) {

      return res.status(400).json({
        message:
          "Insufficient balance"
      });
    }

    wallet.balance -=
      order.total;

    await wallet.save();

    await Transaction.create({

      from: wallet.owner,

      to: order.customerUserId,

      amount: order.total,

      type: "SALE",

      reference: paymentRef,

      orderId: order._id
    });

    order.status = "PAID";

    order.paymentRef =
      paymentRef;

    order.paidAt =
      new Date();

    await order.save();

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;
