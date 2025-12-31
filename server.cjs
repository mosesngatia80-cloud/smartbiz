/**
 * SMART PAY SERVER
 * Render-safe CommonJS setup
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
  res.json({
    status: "ok",
    service: "Smart Pay",
    time: new Date().toISOString()
  });
});

/* =========================
   ROUTES
========================= */
app.use("/api/wallet", require("./routes/wallet"));

/* =========================
   MONGODB CONNECTION
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in environment variables");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Smart Pay running on port ${PORT}`);
});
