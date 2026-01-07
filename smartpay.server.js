const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Smart Pay MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

/* ================= MODELS ================= */
const WalletSchema = new mongoose.Schema({
  owner: String, // phone number or business wallet id
  balance: { type: Number, default: 0 }
});

const TransactionSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  reference: String,
  createdAt: { type: Date, default: Date.now }
});

const Wallet = mongoose.model("Wallet", WalletSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);

/* ================= CORE TRANSFER LOGIC ================= */
async function sendMoney(req, res) {
  try {
    const { from, to, amount, reference } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sender = await Wallet.findOne({ owner: from });
    const receiver = await Wallet.findOne({ owner: to });

    if (!sender) {
      return res.status(404).json({ message: "Sender wallet not found" });
    }

    if (!receiver) {
      return res.status(404).json({ message: "Receiver wallet not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    const tx = await Transaction.create({
      from,
      to,
      amount,
      reference
    });

    res.json({
      message: "Transfer successful",
      transactionId: tx._id
    });

  } catch (err) {
    console.error("❌ Smart Pay transfer error:", err.message);
    res.status(500).json({ message: "Transfer failed" });
  }
}

/* ================= PRIMARY ROUTE ================= */
app.post("/api/transfer", sendMoney);

/* ================= ALIAS ROUTES (IMPORTANT FIX) ================= */
app.post("/api/wallet/send", sendMoney);
app.post("/api/send-money", sendMoney);

/* ================= HEALTH CHECK ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "Smart Pay running" });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Smart Pay running on port ${PORT}`);
});
