const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

// =====================
// M-PESA STK CALLBACK
// =====================
router.post("/callback", async (req, res) => {
  try {
    const stkCallback =
      req.body?.Body?.stkCallback;

    if (!stkCallback) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const {
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // If payment failed
    if (ResultCode !== 0) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Extract metadata
    const items = CallbackMetadata.Item || [];

    const amount = items.find(i => i.Name === "Amount")?.Value;
    const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
    const phone = items.find(i => i.Name === "PhoneNumber")?.Value;
    const reference = items.find(i => i.Name === "AccountReference")?.Value;

    if (!reference) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Find order by ID (AccountReference)
    const order = await Order.findById(reference).populate("items.product");

    if (!order) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Mark order paid
    order.status = "paid";
    order.paymentRef = receipt || "MPESA";
    await order.save();

    console.log("✅ M-PESA payment confirmed:", {
      orderId: order._id,
      amount,
      receipt,
      phone,
    });

    // IMPORTANT: Always respond OK to Safaricom
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("❌ M-PESA callback error:", err.message);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

module.exports = router;
