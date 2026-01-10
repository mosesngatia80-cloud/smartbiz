const express = require("express");
const router = express.Router();

const {
  getReceiptByOrder,
  getReceiptsByCustomer
} = require("../controllers/receipt.controller.js");

// 🔍 Get receipt for an order
router.get("/order/:orderId", getReceiptByOrder);

// 👤 Get all receipts for a customer
router.get("/customer/:customerId", getReceiptsByCustomer);

module.exports = router;

/**
 * 🧾 RECEIPTS BY DATE RANGE (BUSINESS)
 * GET /api/receipts/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/range", auth, async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) {
      return res.status(400).json({ message: "User has no business" });
    }

    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({
        message: "from and to dates are required (YYYY-MM-DD)"
      });
    }

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const receipts = await Receipt.find({
      businessId,
      status: "ISSUED",
      issuedAt: { $gte: start, $lte: end }
    })
      .sort({ issuedAt: -1 });

    const totalAmount = receipts.reduce(
      (sum, r) => sum + r.amount,
      0
    );

    res.json({
      from,
      to,
      count: receipts.length,
      totalAmount,
      currency: "KES",
      receipts
    });
  } catch (err) {
    console.error("❌ Receipt range error:", err.message);
    res.status(500).json({ message: "Failed to load receipts" });
  }
});
