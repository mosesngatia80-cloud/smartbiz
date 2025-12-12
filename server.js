require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business");
const productRoutes = require("./routes/product");
const customerRoutes = require("./routes/customer");
const salesRoutes = require("./routes/saleRoutes");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
app.use(express.json());
app.use(cors());

/* ---------------------------- MONGO CONNECTION --------------------------- */

if (!process.env.MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("DB Error:", err));

/* -------------------------------- ROUTES -------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/product", productRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* ------------------------------ ROOT MESSAGE ----------------------------- */

app.get("/", (req, res) => {
  res.send("NAVU Smart Biz API is running ✔️");
});

/* ------------------------------- START APP ------------------------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
