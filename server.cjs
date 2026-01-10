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
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/payments", require("./routes/payments.wallet.routes"));
app.use("/api/receipts", require("./routes/receipt.routes"));

/* 🔐 ADMIN ROUTES (MOCK WALLET CREDIT) */
app.use("/api/admin", require("./routes/admin.wallet"));

/* 🔒 INTERNAL ROUTES (SMART CONNECT) */
app.use("/api/internal", require("./routes/internal.wallet"));

/* 🔔 SMART PAY WEBHOOK */
app.use("/api/smartpay", require("./routes/smartpay.webhook"));

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "SMART_BIZ_OK" });
});

/* ================= START SERVER AFTER DB ================= */
const PORT = process.env.PORT || 5001;

console.log("🟡 Connecting to MongoDB...");

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4, // FORCE IPV4 (IMPORTANT FOR TERMUX / MOBILE NETWORKS)
  })
  .then(() => {
    console.log("🟢 Smart Biz MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log();
    });
  })
  .catch((err) => {
    console.error("🔴 MongoDB connection failed:");
    console.error(err.message || err);
    process.exit(1);
  });
