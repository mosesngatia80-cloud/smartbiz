const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Order = require("../models/Order");
const Revenue = require("../models/Revenue");

/**
 * 🔐 Verify SmartPay webhook signature (RAW BODY)
 */
function verifySignature(req) {
  const secret = process.env.SMARTPAY_SECRET;
  if (!secret) return false;

  const signature = req.headers["x-smartpay-signature"];
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * 💳 SmartPay webhook
 */
router.post("/smartpay", async (req, res) => {
  console.log("💳 SmartPay webhook received");

  if (!verifySignature(req)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const { orderId, amount, status } = req.body;

  if (!orderId || !amount || !status) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "paid") {
      return res.json({ message: "Order already paid" });
    }

    if (status !== "SUCCESS") {
      return res.json({ message: "Payment not successful" });
    }

    /* =========================
       UPDATE ORDER (ENUM SAFE)
    ========================= */
    order.status = "paid";
    order.paymentMethod = "wallet"; // ✅ ENUM VALID
    order.paymentRef = "SMARTPAY";
    await order.save();

    /* =========================
       CALCULATE REVENUE
    ========================= */
    const grossAmount = amount;
    const fee = Math.round(grossAmount * 0.02); // 2% fee
    const netAmount = grossAmount - fee;

    await Revenue.create({
      business: order.business,
      order: order._id,
      grossAmount,
      fee,
      netAmount,
      channel: "wallet"
    });

    console.log(`✅ Order ${order._id} paid & revenue recorded`);
    res.json({ message: "Payment processed successfully" });

  } catch (err) {
    console.error("❌ SmartPay webhook error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
