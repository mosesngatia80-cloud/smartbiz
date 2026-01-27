const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const Product = require("../models/Product");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Business = require("../models/Business");

router.post("/", auth, async (req, res) => {
  try {
    const text = (req.body.message || "").toLowerCase().trim();
    const userId = req.user.user;

    const business = await Business.findOne({ owner: userId });
    if (!business) {
      return res.status(400).json({ message: "User has no business" });
    }

    // ================= ADD PRODUCT =================
    // add product sugar 120
    if (text.startsWith("add product")) {
      const parts = text.replace("add product", "").trim().split(" ");
      const price = Number(parts.pop());
      const name = parts.join(" ");

      if (!name || !price) {
        return res.status(400).json({ message: "Invalid product command" });
      }

      const product = await Product.create({
        name,
        price,
        owner: userId,
        business: business._id
      });

      return res.json({ action: "ADD_PRODUCT", product });
    }

    // ================= SELL (AI POS) =================
    // sell sugar 2
    if (text.startsWith("sell")) {
      const parts = text.replace("sell", "").trim().split(" ");
      const quantity = Number(parts.pop());
      const name = parts.join(" ");

      if (!name || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid sell command" });
      }

      const product = await Product.findOne({
        name: new RegExp(`^${name}$`, "i"),
        business: business._id
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const totalAmount = product.price * quantity;

      const order = await Order.create({
        owner: userId,                 // ✅ REQUIRED FIELD (FIX)
        business: business._id,
        items: [
          {
            product: product._id,
            name: product.name,
            price: product.price,
            quantity
          }
        ],
        totalAmount,
        source: "AI",
        createdBy: userId
      });

      return res.json({
        action: "SELL",
        order,
        totalAmount
      });
    }

    // ================= ADD CUSTOMER =================
    // add customer john 0706...
    if (text.startsWith("add customer")) {
      const parts = text.replace("add customer", "").trim().split(" ");
      const phone = parts.pop();
      const name = parts.join(" ");

      if (!name || !phone) {
        return res.status(400).json({ message: "Invalid customer command" });
      }

      const customer = await Customer.create({
        name,
        phone,
        owner: userId,
        business: business._id
      });

      return res.json({ action: "ADD_CUSTOMER", customer });
    }

    return res.status(400).json({ message: "Unknown AI command" });

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ message: "AI execution failed" });
  }
});

module.exports = router;
