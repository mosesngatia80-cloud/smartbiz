const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const Expense = require("../models/Expense");
const expenseController = require("../controllers/expenseController");

// Create Expense
router.post("/", auth, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, amount, category } = req.body;

    const created = await Expense.create({
      name,
      amount,
      category,
      businessId
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Get all expenses for business
router.get("/", auth, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const expenses = await Expense.find({ businessId });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Dashboard expense summary
router.get("/summary", auth, expenseController.expenseSummary);

module.exports = router;
