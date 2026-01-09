const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

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
app.use("/api/admin", require("./routes/admin"));

/* ================= SMART PAY WEBHOOK ================= */
app.use("/api/smartpay", require("./routes/smartpay.webhook"));

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "SMART_BIZ_OK" });
});

/* ================= START SERVER FIRST ================= */
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Smart Biz running on port ${PORT}`);
});

/* ================= DATABASE (BACKGROUND) ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Smart Biz MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ DB error:", err.message);
    // DO NOT exit the process — keep server alive in Termux
  });
