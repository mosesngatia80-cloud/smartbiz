const express = require("express");
const router = express.Router();

const mpesaRequest = require("../services/mpesaRequest");
const PaymentEvent = require("../models/PaymentEvent");

/* =========================
   STK PUSH (OUTBOUND)
========================= */
router.post("/stk-push", async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;

    if (!phone || !amount || !orderId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const stkPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: process.env.MPESA_PASSWORD,
      Timestamp: process.env.MPESA_TIMESTAMP,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: orderId,
      TransactionDesc: "Order Payment",
    };

    const response = await mpesaRequest({
      method: "POST",
      url: process.env.MPESA_STK_URL,
      data: stkPayload,
    });

    return res.json(response.data);
  } catch (err) {
    console.error("❌ STK PUSH ERROR:", err.response?.data || err.message);
    return res.status(500).json({ message: "STK push failed" });
  }
});

/* =========================
   M-PESA STK CALLBACK (INBOUND)
   Infrastructure-only
========================= */
router.post("/callback", async (req, res) => {
  try {
    const stkCallback = req.body?.Body?.stkCallback;

    // Always acknowledge Safaricom
    if (!stkCallback) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

    // Save failed payments too (signals matter)
    const items = CallbackMetadata?.Item || [];

    const amount = items.find(i => i.Name === "Amount")?.Value;
    const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
    const phone = items.find(i => i.Name === "PhoneNumber")?.Value;
    const reference = items.find(i => i.Name === "AccountReference")?.Value;

    await PaymentEvent.create({
      provider: "MPESA",
      checkoutRequestId: CheckoutRequestID,
      receipt,
      reference,
      amount,
      phone,
      rawPayload: req.body,
      processed: false,
    });

    console.log("📥 M-PESA payment event recorded:", {
      checkoutRequestId: CheckoutRequestID,
      reference,
      amount,
      receipt,
      phone,
      resultCode: ResultCode,
    });

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("❌ M-PESA callback error:", err.message);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

module.exports = router;
