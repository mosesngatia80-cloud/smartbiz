const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

// Create Expense
router.post("/", expenseController.createExpense);

// Get all Expenses
router.get("/", expenseController.getExpenses);

// Monthly expenses summary
router.get("/monthly", expenseController.getMonthlyExpenses);

module.exports = router;
