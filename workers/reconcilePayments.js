require("dotenv").config();
const mongoose = require("mongoose");

const PaymentEvent = require("../models/PaymentEvent");
const Order = require("../models/Order");

const MONGO_URI = process.env.MONGO_URI;

async function reconcileOnce() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const events = await PaymentEvent.find({ processed: false })
      .sort({ createdAt: 1 })
      .limit(20);

    if (events.length === 0) {
      console.log("ℹ️ No payment events to reconcile");
      await session.commitTransaction();
      session.endSession();
      return;
    }

    for (const event of events) {
      const { reference, amount, receipt, phone } = event;

      if (!reference) {
        event.processed = true;
        event.processedAt = new Date();
        await event.save();
        continue;
      }

      const order = await Order.findById(reference);

      if (!order) {
        console.warn("⚠️ Order not found for payment event:", reference);
        event.processed = true;
        event.processedAt = new Date();
        await event.save();
        continue;
      }

      if (order.status === "paid") {
        event.processed = true;
        event.processedAt = new Date();
        await event.save();
        continue;
      }

      if (Number(order.totalAmount) !== Number(amount)) {
        console.warn("⚠️ Amount mismatch:", {
          orderId: order._id,
          expected: order.totalAmount,
          received: amount,
        });
        continue; // leave unprocessed for investigation
      }

      order.status = "paid";
      order.paymentRef = receipt || "MPESA";
      await order.save();

      event.processed = true;
      event.processedAt = new Date();
      await event.save();

      console.log("✅ Order reconciled:", {
        orderId: order._id,
        amount,
        phone,
      });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Reconciliation error:", err.message);
  }
}

async function start() {
  console.log("🟡 Starting payment reconciliation worker...");
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  console.log("🟢 Worker connected to MongoDB");

  // Run every 15 seconds
  setInterval(reconcileOnce, 15000);
}

start();
