require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Middleware
const auth = require("./middleware/authMiddleware");
const { isAdmin, isCashier, isStaff } = require("./middleware/permissions");

// Routes
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business");
const productRoutes = require("./routes/product");
const customerRoutes = require("./routes/customer");
const salesRoutes = require("./routes/sales");
const expenseRoutes = require("./routes/expense");
const alertRoutes = require("./routes/alerts");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB error", err));

// Public Routes
app.use("/api/auth", authRoutes);

// Protected Routes
app.use("/api/business", auth, isAdmin, businessRoutes);
app.use("/api/products", auth, isAdmin, productRoutes);
app.use("/api/customers", auth, isStaff, customerRoutes);
app.use("/api/sales", auth, isCashier, salesRoutes);
app.use("/api/expenses", auth, isAdmin, expenseRoutes);
app.use("/api/alerts", auth, isStaff, alertRoutes);

// Default Route
app.get("/", (req, res) => {
  res.send("SmartBiz backend is running");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`SmartBiz backend running on port ${PORT}`)
);
