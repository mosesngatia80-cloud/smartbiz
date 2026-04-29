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
app.use("/api/auth", require("./routes/auth.password")); // PASSWORD RESET
app.use("/api/business", require("./routes/business"));
app.use("/api/products", require("./routes/products"));

/* ✅ NEW: MPESA INCOME (READ ONLY) */
app.use("/api/income", require("./routes/income"));

/* ✅ DASHBOARD ORDERS (USER JWT) */
app.use("/api/orders", require("./routes/orders"));

/* ✅ INTERNAL ORDERS (SMART CONNECT / WHATSAPP) */
app.use("/api/internal/orders", require("./routes/orders.routes"));

/* ✅ WALLET ROUTES */
app.use("/api/wallet", require("./routes/wallet"));

app.use("/api/stats", require("./routes/stats"));
app.use("/api/payments", require("./routes/payments.wallet.routes"));
app.use("/api/receipts", require("./routes/receipt.routes"));

/* 🤖 AI ACTION ROUTES */
app.use("/api/ai", require("./routes/ai"));

/* 📲 WHATSAPP CUSTOMER ORDERS */
app.use("/api/whatsapp", require("./routes/whatsapp.orders"));

/* 🔐 ADMIN ROUTES */
app.use("/api/admin", require("./routes/admin.wallet"));

/* 🔒 INTERNAL ROUTES */
app.use("/api/internal", require("./routes/internal.wallet"));
app.use("/api/internal", require("./routes/internal.register"));
app.use("/api/internal", require("./routes/internal.business.link"));
app.use("/api/internal", require("./routes/internal.orders"));

/* 🧪 INTERNAL ENV DEBUG */
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
    family: 4
  })
  .then(async () => {
    console.log("🟢 Smart Biz MongoDB connected");

    /* 🔍 TEMP DEBUG: LIST BUSINESS WALLETS */
    const Wallet = require("./models/Wallet");

    app.get("/api/internal/__debug_wallets", async (req, res) => {
      try {
        const wallets = await Wallet.find({ ownerType: "BUSINESS" });
        res.json(
          wallets.map(w => ({
            walletId: w._id,
            ownerType: w.ownerType,
            balance: w.balance
          }))
        );
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Smart Biz server running on port ${PORT}`);
    });

    require("./workers/reconcilePayments");
  })
  .catch((err) => {
    console.error("🔴 MongoDB connection failed:");
    console.error(err.message || err);
    process.exit(1);
  });

/* ================= SMARTBIZ QUICK ROUTES ================= */

// simple in-memory (temporary)
let sb_sales = 0;
let sb_expenses = 0;

// add cash
app.post("/api/sb/cash", (req, res) => {
  const { amount } = req.body;
  sb_sales += Number(amount || 0);
  res.json({ message: "Cash saved", sales: sb_sales });
});

// add expense
app.post("/api/sb/expense", (req, res) => {
  const { amount } = req.body;
  sb_expenses += Number(amount || 0);
  res.json({ message: "Expense saved", expenses: sb_expenses });
});

// summary
app.get("/api/sb/summary", (req, res) => {
  res.json({
    sales: sb_sales,
    expenses: sb_expenses,
    profit: sb_sales - sb_expenses
  });
});

