const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Business = require("../models/Business");

/**
 * CREATE ORDER
 */
router.post("/", auth, async (req, res) => {
  try {
    const businessId = req.user.business;

    if (!businessId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const business = await Business.findById(businessId);

    if (!business || !business.walletId) {
      return res.status(400).json({
        message: "Business wallet not set"
      });
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
        business: businessId
      });

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product not found for this business" });
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
      business: businessId,
      businessWalletId: business.walletId,
      customerPhone,
      items: orderItems,
      total
      // status defaults to UNPAID
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
