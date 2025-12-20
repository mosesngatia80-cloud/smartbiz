const Sale = require("../models/Sale");
const Product = require("../models/Product");

// Create a sale
exports.createSale = async (req, res) => {
  try {
    const { productId, quantity, unitPrice } = req.body;

    const userId = req.user._id;
    const businessId = req.user.businessId;

    const product = await Product.findOne({ _id: productId, businessId });
    if (!product) {
      return res.status(404).json({ message: "Product not found in your business" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Not enough stock. Available: ${product.stock}`
      });
    }

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    // Total sale calculation
    const totalAmount = quantity * unitPrice;

    const sale = await Sale.create({
      productId,
      quantity,
      unitPrice,
      totalAmount,
      soldBy: userId,
      businessId
    });

    res.status(201).json({
      message: "Sale recorded successfully",
      sale,
      updatedProduct: product
    });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all sales for a business
exports.getSales = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const sales = await Sale.find({ businessId })
      .populate("productId", "name")
      .populate("soldBy", "name email");

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Dashboard Daily Summary
exports.getDailySummary = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      businessId,
      createdAt: { $gte: start, $lt: end }
    });

    const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSales = sales.length;

    res.status(200).json({
      totalSales,
      totalAmount,
      date: new Date().toDateString(),
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Monthly Summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    let start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      businessId,
      createdAt: { $gte: start, $lte: end },
    });

    const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSales = sales.length;

    res.status(200).json({
      month: start.toLocaleString("default", { month: "long" }),
      totalSales,
      totalAmount,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
