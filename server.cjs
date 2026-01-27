require("dotenv").config(); // MUST BE FIRST

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("SMART BIZ ROOT IS ALIVE");
});

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/business", require("./routes/business"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));

/* ✅ WALLET ROUTES (THIS WAS MISSING – ADDED ONLY) */
app.use("/api/wallet", require("./routes/wallet"));

app.use("/api/stats", require("./routes/stats"));
app.use("/api/payments", require("./routes/payments.wallet.routes"));
app.use("/api/receipts", require("./routes/receipt.routes"));

/* 🤖 AI ACTION ROUTES */
app.use("/api/ai", require("./routes/ai"));

/* 🔐 ADMIN ROUTES (MOCK WALLET CREDIT) */
app.use("/api/admin", require("./routes/admin.wallet"));

/* 🔒 INTERNAL ROUTES (SMART CONNECT) */
app.use("/api/internal", require("./routes/internal.wallet"));
app.use("/api/internal", require("./routes/internal.register"));
app.use("/api/internal", require("./routes/internal.business.link"));

/* 🧪 INTERNAL ENV DEBUG (TEMPORARY – SAFE) */
app.get("/api/internal/__debug_env", (req, res) => {
  res.json({
    has_SMARTCONNECT_SECRET: !!process.env.SMARTCONNECT_SECRET,
    len_SMARTCONNECT_SECRET: process.env.SMARTCONNECT_SECRET
      ? process.env.SMARTCONNECT_SECRET.length
      : 0,

    has_SMARTCONNECT_INTERNAL_KEY: !!process.env.SMARTCONNECT_INTERNAL_KEY,
    len_SMARTCONNECT_INTERNAL_KEY: process.env.SMARTCONNECT_INTERNAL_KEY
      ? process.env.SMARTCONNECT_INTERNAL_KEY.length
      : 0,

    has_CT_INTERNAL_KEY: !!process.env.CT_INTERNAL_KEY,
    len_CT_INTERNAL_KEY: process.env.CT_INTERNAL_KEY
      ? process.env.CT_INTERNAL_KEY.length
      : 0
  });
});

/* 🔔 SMART PAY WEBHOOK */
app.use("/api/smartpay", require("./routes/smartpay.webhook"));

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "SMART_BIZ_OK" });
});

/* ================= START SERVER AFTER DB ================= */
const PORT = process.env.PORT || 3000;

console.log("🟡 Connecting to MongoDB...");

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  })
  .then(() => {
    console.log("🟢 Smart Biz MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Smart Biz server running on port ${PORT}`);
    });

    // 🔄 Start payment reconciliation worker (MVP mode)
    require("./workers/reconcilePayments");
  })
  .catch((err) => {
    console.error("🔴 MongoDB connection failed:");
    console.error(err.message || err);
    process.exit(1);
  });
