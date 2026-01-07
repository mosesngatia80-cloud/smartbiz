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
app.use("/api/stats", require("./routes/stats"));
app.use("/api/payments", require("./routes/payments.wallet.routes"));

/* 🔧 TEMP DEV ADMIN ROUTE (REMOVE AFTER USE) */
app.use("/api/admin", require("./routes/admin"));

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "SMART_BIZ_OK" });
});

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Smart Biz MongoDB connected"))
  .catch((err) => {
    console.error("❌ DB error:", err.message);
    process.exit(1);
  });

/* ================= START ================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Smart Biz running on port ${PORT}`);
});
