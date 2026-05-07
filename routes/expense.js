const express = require("express");

const router = express.Router();

const Expense =
  require("../models/Expense");

const Business =
  require("../models/Business");

/* =========================
   ADD EXPENSE
========================= */

router.post(
  "/add",
  async (req, res) => {

  try {

    const {
      whatsappNumber,
      title,
      amount,
      category,
      note
    } = req.body;

    if (
      !whatsappNumber ||
      !title ||
      !amount
    ) {

      return res.status(400).json({
        message:
          "Missing required fields"
      });
    }

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {

      return res.status(404).json({
        message:
          "Business not found"
      });
    }

    const expense =
      await Expense.create({

      business:
        business._id,

      owner:
        business.owner,

      title,

      amount,

      category:
        category || "GENERAL",

      note:
        note || ""
    });

    res.json({
      success: true,
      expense
    });

  } catch (err) {

    console.error(
      "❌ Expense add error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to add expense"
    });
  }
});

/* =========================
   GET EXPENSES
========================= */

router.get(
  "/all",
  async (req, res) => {

  try {

    const {
      whatsappNumber
    } = req.query;

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {

      return res.status(404).json({
        message:
          "Business not found"
      });
    }

    const expenses =
      await Expense.find({
        business:
          business._id
      })

      .sort({
        createdAt: -1
      });

    const totalExpenses =
      expenses.reduce(
        (sum, e) =>
          sum + Number(e.amount),
        0
      );

    res.json({
      totalExpenses,
      expenses
    });

  } catch (err) {

    console.error(
      "❌ Expense fetch error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to fetch expenses"
    });
  }
});

module.exports = router;
