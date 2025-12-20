const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// ROUTES (unwrap .default if present)
const authRoutesRaw = require("./routes/auth");
const businessRoutesRaw = require("./routes/business.routes");
const productRoutesRaw = require("./routes/products");
const customerRoutesRaw = require("./routes/customers");
const orderRoutesRaw = require("./routes/orders.routes");
const revenueRoutesRaw = require("./routes/revenue.routes");
const expenseRoutesRaw = require("./routes/expense");
const saleRoutesRaw = require("./routes/sales");
const alertRoutesRaw = require("./routes/alerts");

const authRoutes = authRoutesRaw.default || authRoutesRaw;
const businessRoutes = businessRoutesRaw.default || businessRoutesRaw;
const productRoutes = productRoutesRaw.default || productRoutesRaw;
const customerRoutes = customerRoutesRaw.default || customerRoutesRaw;
const orderRoutes = orderRoutesRaw.default || orderRoutesRaw;
const revenueRoutes = revenueRoutesRaw.default || revenueRoutesRaw;
const expenseRoutes = expenseRoutesRaw.default || expenseRoutesRaw;
const saleRoutes = saleRoutesRaw.default || saleRoutesRaw;
const alertRoutes = alertRoutesRaw.default || alertRoutesRaw;

// USE ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/alerts", alertRoutes);

// DB + SERVER
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 SmartBiz backend running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
  });
