require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

console.log("🚀 Starting Smart Biz...");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SMART BIZ API RUNNING");
});

/* ================= ROUTES ================= */
app.use("/api/products", require("./products"));
app.use("/api/products", require("./products.public.fix")); // ✅ NEW FIX
app.use("/api/business", require("./business"));
app.use("/api/orders", require("./orders"));
app.use("/api/wallet", require("./wallet"));
app.use("/api/services", require("./services"));
app.use("/api/internal-secure", require("./internal.orders"));
app.use("/api/internal-secure", require("./internal.wallet.topup"));

/* START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

/* CONNECT DB */
console.log("🟡 Connecting to MongoDB...");

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("🟢 Smart Biz DB connected");
})
.catch(err => {
  console.error("❌ DB ERROR:", err.message);
});
