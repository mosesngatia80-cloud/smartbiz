const mongoose = require("mongoose");
const Receipt = require("../models/Receipt.js");

/**
 * 📄 Get receipt by ORDER ID
 * GET /api/receipts/order/:orderId
 */
exports.getReceiptByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const receipt = await Receipt.findOne({
      orderId: new mongoose.Types.ObjectId(orderId)
    })
      .populate("orderId")
      .populate("businessId"); // ❌ customerId populate REMOVED

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.json(receipt);
  } catch (err) {
    console.error("Get receipt by order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 📄 Get receipts by CUSTOMER
 * GET /api/receipts/customer/:customerId
 */
exports.getReceiptsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const receipts = await Receipt.find({
      customerId: new mongoose.Types.ObjectId(customerId)
    }).sort({ createdAt: -1 });

    res.json(receipts);
  } catch (err) {
    console.error("Get receipts by customer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
