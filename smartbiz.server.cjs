require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
console.log("🚀 Starting Smart Biz...");
/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static("uploads")
);
/* ✅ PUBLIC UPLOADS */
   ROOT
app.get("/", (req, res) => {
  res.send(
    "SMART BIZ API RUNNING"
  );
});
   ROUTES
  "/api/products",
  require("./routes/products")
  require("./routes/products.public.fix")
  "/api/business",
  require("./routes/business")
  "/api/business-whatsapp",
  require("./routes/business.whatsapp")
  "/api/auth",
  require("./routes/auth.whatsapp")
  "/api/orders",
  require("./routes/orders")
  "/api/wallet",
  require("./routes/wallet")
  "/api/expense",
  require("./routes/expense")
  "/api/debt",
  require("./routes/debt")
  "/api/dashboard",
  require("./routes/dashboard")
  "/api/internal-secure",
  require("./routes/internal.orders")
  require("./routes/internal.wallet.topup")
   START SERVER
const PORT =
  process.env.PORT || 3000;
app.listen(
  PORT,
  "0.0.0.0",
  () => {
  console.log(
    `🚀 Server started on port ${PORT}`
   CONNECT DB
console.log(
  "🟡 Connecting to MongoDB..."
mongoose.connect(
  process.env.MONGO_URI
)
.then(() => {
    "🟢 Smart Biz DB connected"
})
.catch(err => {
  console.error(
    "❌ DB ERROR:",
    err.message
