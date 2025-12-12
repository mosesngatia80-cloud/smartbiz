const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product'); // adjust path if your Product model is elsewhere

// Create a sale, reduce product stock atomically
exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { business, items, totalAmount, paymentMethod, customer } = req.body;
    if (!business || !items || !items.length || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Begin transaction
    session.startTransaction();

    // Validate & update stock
    for (const it of items) {
      const prod = await Product.findById(it.product).session(session);
      if (!prod) throw new Error(`Product not found: ${it.product}`);
      if (prod.stock == null) prod.stock = 0;
      if (prod.stock < it.quantity) throw new Error(`Insufficient stock for ${prod.name || prod._id}`);
      prod.stock = prod.stock - it.quantity;
      await prod.save({ session });
    }

    // Create sale document
    const sale = new Sale({
      business,
      items,
      totalAmount,
      paymentMethod,
      customer: customer || null,
    });

    await sale.save({ session });

    // Commit
    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Sale recorded', sale });
  } catch (err) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

// List sales for a business (with simple pagination)
exports.listSales = async (req, res) => {
  try {
    const { business } = req.query;
    const page = Math.max(0, parseInt(req.query.page || '0'));
    const limit = Math.min(100, parseInt(req.query.limit || '20'));
    const filter = {};
    if (business) filter.business = business;

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate('items.product')
      .exec();

    res.json({ sales, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('items.product').exec();
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json({ sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Optional: monthly report endpoint (group by month)
exports.monthlyReport = async (req, res) => {
  try {
    const { month } = req.query; // "YYYY-MM" or omit for current month
    const match = {};
    if (month) {
      const start = new Date(month + '-01T00:00:00Z');
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      match.createdAt = { $gte: start, $lt: end };
    } else {
      // current month
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      match.createdAt = { $gte: s, $lt: e };
    }

    const result = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: '$items.subtotal' }, count: { $sum: '$items.quantity' } } },
    ]);

    res.json({ month: month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`, total: result[0]?.total || 0, count: result[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
