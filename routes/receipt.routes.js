const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Receipt = require("../models/Receipt");
const PDFDocument = require("pdfkit");

const {
  getReceiptByOrder,
  getReceiptsByCustomer
} = require("../controllers/receipt.controller.js");

// 🔍 Get receipt for an order
router.get("/order/:orderId", getReceiptByOrder);

// 👤 Get all receipts for a customer
router.get("/customer/:customerId", getReceiptsByCustomer);

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
    }).sort({ issuedAt: -1 });

    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

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

/**
 * 🧾 EXPORT RECEIPT AS PDF
 * GET /api/receipts/:receiptId/pdf
 */
router.get("/:receiptId/pdf", auth, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.receiptId)
      .populate("businessId")
      .populate("orderId");

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (receipt.businessId._id.toString() !== req.user.business) {
      return res.status(403).json({ message: "Access denied" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=receipt-${receipt.receiptId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text(receipt.businessId.name, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text("OFFICIAL RECEIPT", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(10);
    doc.text(`Receipt ID: ${receipt.receiptId}`);
    doc.text(`Date: ${new Date(receipt.issuedAt).toLocaleString()}`);
    doc.text(`Payment Method: ${receipt.paymentMethod}`);
    doc.moveDown();

    doc.text(`Customer Phone: ${receipt.customerPhone}`);
    doc.moveDown();

    doc.fontSize(14).text(
      `TOTAL: ${receipt.currency} ${receipt.amount}`,
      { underline: true }
    );

    doc.moveDown(2);
    doc.fontSize(10).text("Thank you for your business.", { align: "center" });
    doc.text("Powered by NAVU Smart Biz", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("❌ Receipt PDF error:", err.message);
    res.status(500).json({ message: "Failed to generate receipt PDF" });
  }
});

module.exports = router;
