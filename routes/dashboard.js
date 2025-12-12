const express = require("express");
const Sale = require("../models/Sale");
const Business = require("../models/Business");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

const router = express.Router();

// 📌 GET FULL DASHBOARD DATA
router.get("/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;

    // 1️⃣ BUSINESS CHECK
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ error: "Business not found" });

    // 2️⃣ TOTAL SALES
    const totalSales = await Sale.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // 3️⃣ TOTAL CUSTOMERS
    const totalCustomers = await Customer.countDocuments({
      business: business._id
    });

    // 4️⃣ TOTAL PRODUCTS
    const totalProducts = await Product.countDocuments({
      business: business._id
    });

    // 5️⃣ RECENT SALES (limit 5)
    const recentSales = await Sale.find({ business: business._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer")
      .populate("items.product");

    // 6️⃣ RESPONSE
    res.json({
      business: business.name,
      totalSales: totalSales[0]?.total || 0,
      totalCustomers,
      totalProducts,
      recentSales
    });

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
