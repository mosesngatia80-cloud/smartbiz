/**
 * SMART PAY SERVER
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
   ROUTES
========================= */
app.use("/api/wallet", require("./routes/wallet"));

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

    // 🔥 CRITICAL FIX: DROP OLD phone_1 INDEX
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const walletCollection = collections.find(c => c.name === "wallets");

      if (walletCollection) {
        const indexes = await mongoose.connection.db
          .collection("wallets")
          .indexes();

        const phoneIndex = indexes.find(i => i.name === "phone_1");

        if (phoneIndex) {
          await mongoose.connection.db
            .collection("wallets")
            .dropIndex("phone_1");

          console.log("🧹 Dropped legacy phone_1 index");
        }
      }
    } catch (err) {
      console.error("⚠️ Index cleanup skipped:", err.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Smart Pay running on port ${PORT}`);
});
