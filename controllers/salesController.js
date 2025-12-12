const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Helpers for date ranges
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
};

// Create a sale + auto stock deduction
exports.createSale = async (req, res) => {
  try {
    const { customerId, items } = req.body;
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "customerId and items are required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    let totalAmount = 0;
    const processedItems = [];

    // Use transaction to keep DB consistent
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of items) {
        const { productId, quantity } = item;
        if (!productId || !quantity || quantity <= 0) {
          await session.abortTransaction();
          return res.status(400).json({ message: "productId and positive quantity required for each item" });
        }

        const product = await Product.findById(productId).session(session);
        if (!product) {
          await session.abortTransaction();
          return res.status(404).json({ message: `Product not found: ${productId}` });
        }

        if (typeof product.stock === "number" && product.stock < quantity) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Insufficient stock for product: ${product.name || product._id}` });
        }

        const price = product.price || 0;
        const subtotal = price * quantity;
        totalAmount += subtotal;

        // Reduce stock if stock field exists
        if (typeof product.stock === "number") {
          product.stock -= quantity;
          await product.save({ session });
        }

        processedItems.push({
          product: product._id,
          quantity,
          price,
          subtotal,
        });
      }

      const sale = new Sale({
        customer: customerId,
        items: processedItems,
        totalAmount,
        paymentStatus: "pending",
      });

      await sale.save({ session });
      await session.commitTransaction();
      session.endSession();

      const populated = await Sale.findById(sale._id).populate("customer").populate("items.product");
      return res.status(201).json(populated);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .populate("customer")
      .populate("items.product");
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single sale
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("customer")
      .populate("items.product");

    if (!sale) return res.status(404).json({ message: "Sale not found" });

    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update sale (adjust stock based on difference)
exports.updateSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const { items, customerId, paymentStatus } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // If items provided, we must calculate differences and update product stock
    if (items && Array.isArray(items)) {
      // Map current quantities by productId
      const currentQuantities = {};
      for (const it of sale.items) {
        currentQuantities[it.product.toString()] = (currentQuantities[it.product.toString()] || 0) + it.quantity;
      }

      // Map new quantities
      const newQuantities = {};
      for (const it of items) {
        newQuantities[it.productId] = (newQuantities[it.productId] || 0) + it.quantity;
      }

      // Start transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // For every product seen in either old or new, compute diff and adjust stock
        const productIds = new Set([...Object.keys(currentQuantities), ...Object.keys(newQuantities)]);
        for (const pid of productIds) {
          const oldQ = currentQuantities[pid] || 0;
          const newQ = newQuantities[pid] || 0;
          const diff = newQ - oldQ; // positive -> reduce stock, negative -> restore stock
          if (diff === 0) continue;

          const product = await Product.findById(pid).session(session);
          if (!product) {
            await session.abortTransaction();
            return res.status(404).json({ message: `Product not found: ${pid}` });
          }

          // If reducing stock, ensure enough
          if (diff > 0 && typeof product.stock === "number" && product.stock < diff) {
            await session.abortTransaction();
            return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
          }

          if (typeof product.stock === "number") {
            product.stock -= diff;
            await product.save({ session });
          }
        }

        // Build processed items with price/subtotal using current product prices
        let totalAmount = 0;
        const processedItems = [];
        for (const it of items) {
          const product = await Product.findById(it.productId).session(session);
          const price = product.price || 0;
          const subtotal = price * it.quantity;
          totalAmount += subtotal;
          processedItems.push({
            product: product._id,
            quantity: it.quantity,
            price,
            subtotal,
          });
        }

        sale.items = processedItems;
        sale.totalAmount = totalAmount;
        if (customerId) sale.customer = customerId;
        if (paymentStatus) sale.paymentStatus = paymentStatus;

        await sale.save({ session });
        await session.commitTransaction();
        session.endSession();

        const populated = await Sale.findById(sale._id).populate("customer").populate("items.product");
        return res.json(populated);
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    } else {
      // If only updating metadata (e.g., paymentStatus or customer)
      if (customerId) sale.customer = customerId;
      if (paymentStatus) sale.paymentStatus = paymentStatus;
      await sale.save();
      const populated = await Sale.findById(sale._id).populate("customer").populate("items.product");
      return res.json(populated);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete sale + restore stock
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Start transaction to restore stock then delete sale
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of sale.items) {
        const product = await Product.findById(item.product).session(session);
        if (product && typeof product.stock === "number") {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }

      await Sale.findByIdAndDelete(req.params.id).session(session);
      await session.commitTransaction();
      session.endSession();

      return res.json({ message: "Sale deleted & stock restored" });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark sale as paid
exports.markAsPaid = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    sale.paymentStatus = "paid";
    await sale.save();

    res.json({ message: "Payment recorded", sale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// SmartPay payment hook (mock) - create a payment request (placeholder)
exports.payViaSmartPay = async (req, res) => {
  try {
    // This is a placeholder. When integrating the real SmartPay API:
    // 1) Create payment request using SmartPay credentials
    // 2) Save payment attempt and callback reference
    // 3) Return payment status or URL/checkout

    // For now we return a mocked response and simulate a pending payment
    const sale = await Sale.findById(req.params.id).populate("customer").populate("items.product");
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Mock response
    return res.json({
      message: "SmartPay mock payment initiated",
      saleId: sale._id,
      amount: sale.totalAmount,
      status: "pending",
      note: "Replace endpoint with real SmartPay integration when ready"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment gateway error" });
  }
};

/*
  REPORTS & PROFIT
  - Daily / Weekly / Monthly sales totals
  - Profit calculation per product and total
*/

// Utility to compute totals in a date range
const salesInRange = async (start, end) => {
  const sales = await Sale.find({
    createdAt: { $gte: start, $lte: end },
    paymentStatus: { $in: ["paid", "pending", ""] } // include all sales unless you want only 'paid'
  }).populate("items.product");
  return sales;
};

exports.dailyReport = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = startOfDay(date);
    const end = endOfDay(date);
    const sales = await salesInRange(start, end);

    const total = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    res.json({ date: start.toISOString().slice(0,10), total, count: sales.length, sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.weeklyReport = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    // week start = Monday
    const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);
    const start = startOfDay(monday);
    const end = endOfDay(new Date(start.getTime() + (6 * 24 * 60 * 60 * 1000)));
    const sales = await salesInRange(start, end);
    const total = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    res.json({ weekStart: start.toISOString().slice(0,10), weekEnd: end.toISOString().slice(0,10), total, count: sales.length, sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.monthlyReport = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    const sales = await salesInRange(start, end);
    const total = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    res.json({ month: `${date.getFullYear()}-${(date.getMonth()+1)}`, total, count: sales.length, sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Profit calculation (overall or by date range). Assumes Product has `costPrice`.
exports.profitReport = async (req, res) => {
  try {
    // Optional start,end query params (ISO dates). If not provided, calculate for all time.
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: { $in: ["paid", "pending", ""] }
    }).populate("items.product");

    let totalProfit = 0;
    const byProduct = {};

    for (const s of sales) {
      for (const it of s.items) {
        const prod = it.product;
        const cost = (prod && prod.costPrice) ? prod.costPrice : 0;
        const profitPerUnit = (it.price || 0) - cost;
        const profit = profitPerUnit * it.quantity;
        totalProfit += profit;

        const pid = prod ? prod._id.toString() : "unknown";
        if (!byProduct[pid]) {
          byProduct[pid] = {
            product: prod,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0
          };
        }
        byProduct[pid].quantity += it.quantity;
        byProduct[pid].revenue += (it.price || 0) * it.quantity;
        byProduct[pid].cost += cost * it.quantity;
        byProduct[pid].profit += profit;
      }
    }

    res.json({ start: start.toISOString(), end: end.toISOString(), totalProfit, byProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
