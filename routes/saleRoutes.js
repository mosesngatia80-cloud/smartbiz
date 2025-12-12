const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// CREATE SALE
router.post("/", async (req, res) => {
  try {
    const { business, customerId, items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Calculate total
    let totalAmount = 0;

    for (let item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      totalAmount += product.price * item.quantity;
    }

    // Create sale record
    const newSale = new Sale({
      business,
      customer: customerId || null,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "cash",
    });

    await newSale.save();

    res.json({
      message: "Sale created successfully",
      sale: newSale,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL SALES FOR A BUSINESS
router.get("/:businessId", async (req, res) => {
  try {
    const sales = await Sale.find({ business: req.params.businessId })
      .populate("customer")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SALE DETAILS
router.get("/details/:saleId", async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId)
      .populate("customer")
      .populate("items.product");

    if (!sale) return res.status(404).json({ error: "Sale not found" });

    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
