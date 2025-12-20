const Expense = require("../models/Expense");

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get monthly expenses
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      month: start.getMonth() + 1,
      total,
      count: expenses.length,
      expenses
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Expense summary
exports.expenseSummary = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const expenses = await Expense.find({ businessId });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      count: expenses.length,
      total
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
