/**
 * SMART PAY + SMART BIZ SERVER
 * Render-safe + Mongo index fix
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "Smart Pay running" });
});

/* =========================
   ROUTES (SMART BIZ + SMART PAY)
========================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/business", require("./routes/business"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/wallet", require("./routes/wallet"));

/* 🔥 PAYMENTS (THIS WAS MISSING) */
app.use("/api/payments", require("./routes/payments"));

/* 🔥 DASHBOARD & REPORTS */
app.use("/api/stats", require("./routes/stats"));
app.use("/api/reports", require("./routes/reports"));

/* =========================
   MONGODB CONNECTION
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Smart Pay running on port ${PORT}`);
});
