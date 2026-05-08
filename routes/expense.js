const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");
const Business = require("../models/Business");

/* =========================
   CREATE EXPENSE
========================= */

router.post("/create", async (req, res) => {

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
        message: "Missing fields"
      });
    }

    /* 🔍 FIND BUSINESS */

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {

      return res.status(404).json({
        message: "Business not found"
      });
    }

    /* ✅ CREATE EXPENSE */

    const expense =
      await Expense.create({

        business:
          business._id,

        owner:
          business.owner,

        title,

        amount:
          Number(amount),

        category:
          category || "GENERAL",

        note:
          note || ""
      });

    res.json({

      message:
        "Expense created ✅",

      expense
    });

  } catch (err) {

    console.error(
      "CREATE EXPENSE ERROR:",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   GET BUSINESS EXPENSES
========================= */

router.get("/", async (req, res) => {

  try {

    const whatsappNumber =
      req.query.whatsappNumber;

    if (!whatsappNumber) {

      return res.status(400).json({
        message:
          "WhatsApp number required"
      });
    }

    /* 🔍 FIND BUSINESS */

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

    /* ✅ LOAD EXPENSES */

    const expenses =
      await Expense.find({
        business:
          business._id
      })
      .sort({
        createdAt: -1
      });

    /* 💰 TOTAL EXPENSES */

    const totalExpenses =
      expenses.reduce(
        (sum, e) =>
          sum + e.amount,
        0
      );

    res.json({

      totalExpenses,

      expenses
    });

  } catch (err) {

    console.error(
      "GET EXPENSES ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to fetch expenses"
    });
  }
});

module.exports = router;
